"""
activity_mock.py  →  ActivityPipelineAdapter

Replaces the old random mock with the real ActivityPipeline
loaded from backend/model/activity_pipeline.pkl.

Contract with ModelManager.process_frame():
  - process(frame) must return a list of event dicts
  - Each dict follows the existing event schema:
      {source, event_type, confidence, timestamp, metadata}

Graceful fallback:
  If the pkl or mediapipe is unavailable (e.g. CI environment),
  the adapter falls back to the original random mock so the
  rest of the app doesn't break.
"""

import os
import sys
import time
import pickle
import pathlib

# ── Resolve paths ──────────────────────────────────────────────────────────────
_THIS_DIR    = pathlib.Path(__file__).resolve().parent          # ml/models/
_REPO_ROOT   = _THIS_DIR.parent.parent                          # e:/SAHARA/
_MODEL_DIR   = _REPO_ROOT / "backend" / "model"
_PKL_PATH    = _MODEL_DIR / "activity_pipeline_model.pkl"
_PIPELINE_PY = _MODEL_DIR / "activity_pipeline.py"

# ── Load the real pipeline ─────────────────────────────────────────────────────
def _load_pipeline():
    """
    Load ActivityPipeline from the pkl file.
    Adds backend/model to sys.path so pickle can find the class definition.
    Returns the pipeline object or None on any error.
    """
    str_model_dir = str(_MODEL_DIR)
    if str_model_dir not in sys.path:
        sys.path.insert(0, str_model_dir)

    # Block mediapipe.tasks from pulling in tensorflow/jax which causes
    # ml_dtypes version conflicts (float8_e3m4 missing in older builds).
    # We only need mediapipe.python.solutions (Pose + FaceMesh).
    import types
    if "mediapipe.tasks" not in sys.modules:
        sys.modules["mediapipe.tasks"] = types.ModuleType("mediapipe.tasks")
        sys.modules["mediapipe.tasks.python"] = types.ModuleType("mediapipe.tasks.python")

    try:
        # Import the class so pickle can reconstruct it
        import activity_pipeline  # noqa: F401 — side-effect import for pickle
        with open(_PKL_PATH, "rb") as f:
            pipeline = pickle.load(f)
        print(f"[ActivityPipeline] Loaded from {_PKL_PATH}")
        return pipeline
    except FileNotFoundError:
        print(f"[ActivityPipeline] WARNING: pkl not found at {_PKL_PATH}. Using mock.")
        return None
    except ImportError as e:
        print(f"[ActivityPipeline] WARNING: Import error ({e}). Using mock.")
        return None
    except Exception as e:
        print(f"[ActivityPipeline] WARNING: Failed to load ({e}). Using mock.")
        return None



# ── Severity helpers ───────────────────────────────────────────────────────────
_URGENT_POSTURES  = {"falling", "sleeping"}   # always emit an event
_NOTABLE_POSTURES = {"lying"}                  # emit after 10 s horizontal
_INTAKE_EVENTS    = {"EATING", "DRINKING"}

def _get_event_type(posture: str) -> str:
    if posture == "falling":
        return "fall"
    if posture in ("sleeping", "lying"):
        return "lying_down"
    return "activity"

def _get_confidence(result: dict) -> float:
    """Use wrist-proximity confidence for intake events, else 0.95."""
    if result.get("is_intake"):
        return round(result.get("confidence", 0.9), 3)
    return 0.95


# ── Main adapter class ─────────────────────────────────────────────────────────

class ActivityPipelineAdapter:
    """
    Wraps ActivityPipeline to conform to the ModelManager interface:
        events = model.process(bgr_frame)

    Event emission rules
    --------------------
    1. POSTURE EVENTS
       - "falling"           → emitted immediately every frame (critical alert)
       - "sleeping"/"lying"  → emitted once when horizontal_duration > 10 s
       - All others          → emitted every `posture_interval` seconds

    2. INTAKE EVENTS
       - Emitted on every new bite (is_intake rising edge) with bite_count + bpm

    3. COMBINED EVENT
       - One summary event per `summary_interval` seconds containing
         the full pipeline result dict (useful for dashboard polling)
    """

    def __init__(
        self,
        posture_interval: float  = 20.0,
        summary_interval: float  = 10.0,
        fall_cooldown:    float  = 5.0,
    ):
        self._pipeline = _load_pipeline()
        self._use_real = self._pipeline is not None

        # Timing
        self._last_posture_event: float = 0.0
        self._last_summary_event: float = 0.0
        self._last_fall_event:    float = 0.0
        self._last_posture:       str   = ""
        self._last_was_intake:    bool  = False

        self.posture_interval = posture_interval
        self.summary_interval = summary_interval
        self.fall_cooldown    = fall_cooldown

        # ── Fallback mock state (used if pipeline unavailable) ──────────────
        if not self._use_real:
            import random
            self._random = random
            self._mock_interval   = 20.0
            self._mock_last_check = time.time()

    # ── ModelManager interface ─────────────────────────────────────────────────

    def process(self, bgr_frame) -> list:
        """
        Called by ModelManager.process_frame() for every camera frame.
        Returns a (possibly empty) list of event dicts.
        """
        if not self._use_real:
            return self._mock_process()

        try:
            result = self._pipeline.predict(bgr_frame)
        except Exception as e:
            print(f"[ActivityPipeline] predict() error: {e}")
            return []

        return self._events_from_result(result)

    # ── Event builder ──────────────────────────────────────────────────────────

    def _events_from_result(self, result: dict) -> list:
        events = []
        now    = time.time()

        posture   = result.get("posture", "unknown")
        is_intake = result.get("is_intake", False)
        horiz_dur = result.get("horizontal_duration", 0.0)

        # 1. Fall alert — high-priority, deduplicated by cooldown
        if posture == "falling":
            if now - self._last_fall_event > self.fall_cooldown:
                self._last_fall_event = now
                events.append(self._make_event(
                    event_type  = "fall",
                    confidence  = 1.0,
                    timestamp   = now,
                    metadata    = {
                        "posture":    posture,
                        "body_angle": result.get("body_angle", 0.0),
                        "fps":        result.get("fps", 0.0),
                    }
                ))

        # 2. Horizontal posture alert (lying/sleeping after 10 s)
        elif posture in ("sleeping", "lying") and horiz_dur > 10.0:
            if posture != self._last_posture:            # only on state change
                events.append(self._make_event(
                    event_type  = "lying_down",
                    confidence  = 0.95,
                    timestamp   = now,
                    metadata    = {
                        "posture":              posture,
                        "horizontal_duration":  round(horiz_dur, 1),
                    }
                ))

        # 3. Regular posture event (throttled)
        elif now - self._last_posture_event > self.posture_interval:
            self._last_posture_event = now
            events.append(self._make_event(
                event_type  = "activity",
                confidence  = 0.95,
                timestamp   = now,
                metadata    = {
                    "posture":       posture,
                    "posture_label": result.get("posture_label", posture.upper()),
                    "body_angle":    result.get("body_angle", 0.0),
                    "fps":           result.get("fps", 0.0),
                }
            ))

        self._last_posture = posture

        # 4. Intake (eating / drinking) — rising edge only
        if is_intake and not self._last_was_intake:
            intake_label = result.get("intake", "EATING")
            if intake_label in _INTAKE_EVENTS:
                events.append(self._make_event(
                    event_type  = "intake",
                    confidence  = _get_confidence(result),
                    timestamp   = now,
                    metadata    = {
                        "intake":     intake_label,
                        "bite_count": result.get("bite_count", 0),
                        "bpm":        result.get("bpm", 0.0),
                    }
                ))

        self._last_was_intake = is_intake

        # 5. Summary snapshot (for dashboard polling)
        if now - self._last_summary_event > self.summary_interval:
            self._last_summary_event = now
            events.append(self._make_event(
                event_type  = "activity_summary",
                confidence  = 1.0,
                timestamp   = now,
                metadata    = {k: v for k, v in result.items()
                               if k not in ("posture_color", "intake_color")}
            ))

        return events

    # ── Shared helpers ─────────────────────────────────────────────────────────

    @staticmethod
    def _make_event(event_type, confidence, timestamp, metadata) -> dict:
        return {
            "source":     "Camera_Edge",
            "event_type": event_type,
            "confidence": confidence,
            "timestamp":  timestamp,
            "metadata":   metadata,
        }

    # ── Fallback mock (used when pipeline unavailable) ─────────────────────────

    def _mock_process(self) -> list:
        """Original random mock — only used when real pipeline fails to load."""
        now = time.time()
        if now - self._mock_last_check < self._mock_interval:
            return []
        self._mock_last_check = now
        activity = self._random.choice(["walking", "sitting", "standing", "sleeping"])
        print(f"--- MOCK ACTIVITY (fallback) --- Detected: {activity}")
        return [self._make_event(
            event_type  = "activity",
            confidence  = 0.75,
            timestamp   = now,
            metadata    = {"posture": activity, "source": "mock_fallback"},
        )]


# ── Keep backward-compatible name ─────────────────────────────────────────────
ActivityMockModel = ActivityPipelineAdapter
