import cv2
import mediapipe as mp
import time

class FallDetectionModel:
    def __init__(self, velocity_threshold=0.15, history_frames=10):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
        self.velocity_threshold = velocity_threshold
        self.history_frames = history_frames
        
        self.y_history = []
        self.last_fall_time = 0

    def process(self, frame):
        """
        Uses MediaPipe Pose landmarks to detect rapid y-axis (vertical) dropping.
        """
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(image_rgb)
        
        events = []
        
        if results.pose_landmarks:
            # We track the midpoint of the shoulders/hips. Here we just take the nose for simplicity
            nose_y = results.pose_landmarks.landmark[self.mp_pose.PoseLandmark.NOSE].y
            
            self.y_history.append(nose_y)
            if len(self.y_history) > self.history_frames:
                self.y_history.pop(0)
                
                # Calculate velocity between oldest frame in history and newest
                # y in mediapipe goes from 0 (top) to 1 (bottom). 
                # A rapid increase in y means falling down.
                velocity = self.y_history[-1] - self.y_history[0]
                
                if velocity > self.velocity_threshold:
                    # Debounce to avoid spamming the API (cooldown 5 seconds)
                    current_time = time.time()
                    if current_time - self.last_fall_time > 5:
                        self.last_fall_time = current_time
                        print(f"--- FALL DETECTED --- Velocity: {velocity:.2f}")
                        
                        events.append({
                            "source": "Camera_Edge",
                            "event_type": "fall",
                            "confidence": min(float(velocity / 0.3), 1.0), # Normalize confidence loosely
                            "timestamp": current_time,
                            "metadata": {"velocity": float(velocity)}
                        })
                        
                        # Clear history after fall to reset
                        self.y_history.clear()
        
        return events
