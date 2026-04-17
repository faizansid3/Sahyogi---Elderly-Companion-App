from fastapi import APIRouter, HTTPException, BackgroundTasks, status, File, UploadFile
from pydantic import BaseModel
from typing import Optional, List
from services.event_manager import process_event
from services.firebase_admin import db
from firebase_admin import firestore
from groq import Groq
import time
import uuid
import traceback
import os
import json
import tempfile
import asyncio

router = APIRouter()

# ──────────────────────────────────────────────────────────────
# Load Whisper model ONCE globally (avoids re-loading per request)
# ──────────────────────────────────────────────────────────────
whisper_model = None

def get_whisper_model():
    global whisper_model
    if whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            print("[Whisper] Loading model (base, int8)...")
            whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
            print("[Whisper] Model loaded ✅")
        except Exception as e:
            print(f"[Whisper] Failed to load model: {e}")
    return whisper_model

def get_groq_key():
    """Read lazily so load_dotenv() has already run."""
    return os.getenv("GROQ_API_KEY")


class STTResult(BaseModel):
    user_text: str
    response: str
    intent: str

@router.post("/speech-to-text")
async def speech_to_text(
    file: UploadFile = File(...),
    mode: str = "general",
    med_name: Optional[str] = None,
    dosage: Optional[str] = None
):
    GROQ_API_KEY = get_groq_key()
    tmp_path = None

    try:
        if not GROQ_API_KEY:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY missing. Add it to configs/.env")

        # ── Step 1: Read & validate audio ──────────────────────
        audio_content = await file.read()
        file_size = len(audio_content)
        print(f"[STT] Received audio: {file_size} bytes, mode={mode}, med={med_name}")

        if file_size < 1000:
            return {
                "user_text": "",
                "response": "I couldn't hear anything. Please try speaking again.",
                "intent": "unclear"
            }

        # ── Step 2: Save temp file for Whisper ─────────────────
        with tempfile.NamedTemporaryFile(suffix=".m4a", delete=False) as tmp:
            tmp.write(audio_content)
            tmp_path = tmp.name

        # ── Step 3: Transcribe with faster-whisper ──────────────
        model = get_whisper_model()
        if not model:
            raise HTTPException(status_code=500, detail="Whisper model not available. Run: pip install faster-whisper")

        segments, info = model.transcribe(tmp_path, beam_size=5)
        user_text = " ".join(seg.text.strip() for seg in segments).strip()
        print(f"[Whisper] Transcription: '{user_text}' (lang={info.language}, prob={info.language_probability:.2f})")

        if not user_text:
            return {
                "user_text": "",
                "response": "I couldn't make out what you said. Could you please repeat?",
                "intent": "unclear"
            }

        # ── Step 4: Build prompt ────────────────────────────────
        system_prompt = f"""You are Sahyogi, a caring and warm assistant for elderly users.

Context:
- Medicine Name: {med_name or 'N/A'}
- Dosage: {dosage or 'N/A'}
- Mode: {mode}

Your tasks:
1. Respond naturally and helpfully in a warm, friendly tone.
2. If Mode = "reminder": determine if the user confirmed taking medicine.
3. If Mode = "general": respond to their question or statement conversationally.

Intent classification rules:
- "taken"     → user said yes, took it, done, had it, drank it
- "not_taken" → user said no, later, not yet, will take later
- "normal"    → general talk, questions, stories, greetings
- "unclear"   → cannot determine, ambiguous, or empty

Return ONLY valid JSON. No explanation. No markdown fences. No extra text:
{{"response": "<short friendly reply, 1-2 sentences>", "intent": "taken|not_taken|normal|unclear"}}"""

        # ── Step 5: Call Groq LLM ───────────────────────────────
        print(f"[Groq] User said: '{user_text}'")
        print(f"[Groq] Sending to LLM at {time.strftime('%H:%M:%S')}...")
        
        groq_client = Groq(api_key=GROQ_API_KEY)

        # Call Groq in a separate thread to avoid blocking the event loop
        try:
            completion = await asyncio.to_thread(
                groq_client.chat.completions.create,
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_text}
                ],
                temperature=0.7
            )
        except Exception as groq_err:
            print(f"[Groq] API Call Failed: {str(groq_err)}")
            raise HTTPException(status_code=502, detail=f"LLM Service Error: {str(groq_err)}")

        ai_raw = completion.choices[0].message.content
        print(f"[Groq] Received response at {time.strftime('%H:%M:%S')}")
        print(f"[Groq] Raw output: {ai_raw}")

        # Robust JSON cleaning
        ai_raw_clean = ai_raw.strip()
        if ai_raw_clean.startswith("```json"):
            ai_raw_clean = ai_raw_clean[7:]
        if ai_raw_clean.startswith("```"):
            ai_raw_clean = ai_raw_clean[3:]
        if ai_raw_clean.endswith("```"):
            ai_raw_clean = ai_raw_clean[:-3]
        ai_raw_clean = ai_raw_clean.strip()

        try:
            ai_data = json.loads(ai_raw_clean)
        except json.JSONDecodeError as jde:
            print(f"[Groq] JSON Parse Error: {str(jde)} | Content: {ai_raw_clean}")
            # Fallback for non-JSON responses
            ai_data = {
                "response": ai_raw_clean,
                "intent": "normal"
            }

        return {
            "user_text": user_text,
            "response": ai_data.get("response", "I hear you!"),
            "intent":   ai_data.get("intent", "normal")
        }


    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e) or type(e).__name__
        print(f"[STT] CRASH: {err_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=err_msg)
    finally:
        # Always clean up temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


# --- Schemas ---

class RegisterPayload(BaseModel):
    name: str
    email: str
    phone: str
    password: str

class LoginPayload(BaseModel):
    email: str
    password: str

class ElderPayload(BaseModel):
    primary_manager_id: str
    name: str
    age: int

class MedicinePayload(BaseModel):
    elder_id: str
    name: str
    dosage: str
    time: str # "08:00 AM" or unix timestamp equivalent

class EventPayload(BaseModel):
    source: str
    event_type: str
    confidence: float
    timestamp: float
    elder_id: str
    metadata: Optional[dict] = {}

class EmergencyPayload(BaseModel):
    user_id: str # This acts as elder_id from the mobile app
    lat: Optional[float] = None
    lng: Optional[float] = None

# --- Auth & Users ---

@router.post("/auth/register")
def register_caregiver(payload: RegisterPayload):
    try:
        if db is None:
            raise HTTPException(status_code=500, detail="Database disabled")
        
        # Simple check for existing email
        print(f"Checking existing email: {payload.email}")
        existing = db.collection("users").where("email", "==", payload.email).get()
        if len(existing) > 0:
            raise HTTPException(status_code=400, detail="Email already registered")

        uid = str(uuid.uuid4())
        user_data = {
            "uid": uid,
            "name": payload.name,
            "email": payload.email,
            "phone": payload.phone,
            "password_hash": payload.password,
            "managed_elder_id": None
        }
        print(f"Creating user: {uid}")
        db.collection("users").document(uid).set(user_data)
        return {"status": "success", "user": user_data}
    except HTTPException as he:
        # Re-raise deliberate HTTP errors (like "Email already registered")
        raise he
    except Exception as e:
        print("CRITICAL ERROR IN REGISTER:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.post("/auth/login")
def login_caregiver(payload: LoginPayload):
    if db is None:
        raise HTTPException(status_code=500, detail="Database disabled")
        
    users = db.collection("users").where("email", "==", payload.email).get()
    if not users:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = users[0].to_dict()
    if user_data.get("password_hash") != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    return {"status": "success", "user": user_data}

# --- Profiles ---

@router.post("/elder/setup")
def setup_elder(payload: ElderPayload):
    if db is None:
        raise HTTPException(status_code=500, detail="Database disabled")

    eid = str(uuid.uuid4())
    elder_data = {
        "eid": eid,
        "primary_manager_id": payload.primary_manager_id,
        "name": payload.name,
        "age": payload.age
    }
    db.collection("elders").document(eid).set(elder_data)
    
    # Link back to user
    db.collection("users").document(payload.primary_manager_id).update({
        "managed_elder_id": eid
    })
    
    return {"status": "success", "elder": elder_data}

@router.get("/elder/profile/{manager_id}")
def get_elder_profile(manager_id: str):
    if db is None:
        return {"elder": None}
        
    user_doc = db.collection("users").document(manager_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="Manager not found")
        
    managed_eid = user_doc.to_dict().get("managed_elder_id")
    if not managed_eid:
        return {"status": "success", "elder": None}
        
    elder_doc = db.collection("elders").document(managed_eid).get()
    return {"status": "success", "elder": elder_doc.to_dict()}

# --- Medicines ---

@router.post("/medicines")
def add_medicine(payload: MedicinePayload):
    if db is None:
        raise HTTPException(status_code=500, detail="Database disabled")

    mid = str(uuid.uuid4())
    med_data = {
        "mid": mid,
        "elder_id": payload.elder_id,
        "name": payload.name,
        "dosage": payload.dosage,
        "time": payload.time,
        "status": "pending", # 'pending', 'taken', 'missed'
        "updated_at": time.time()
    }
    db.collection("medicines").document(mid).set(med_data)
    return {"status": "success", "medicine": med_data}

@router.get("/medicines/{elder_id}")
def get_medicines(elder_id: str):
    if db is None:
        return {"status": "success", "medicines": []}
        
    meds = db.collection("medicines").where("elder_id", "==", elder_id).get()
    return {"status": "success", "medicines": [m.to_dict() for m in meds]}

@router.post("/medicines/{mid}/status")
def update_medicine_status(mid: str, status: str):
    if db is None:
         raise HTTPException(status_code=500, detail="Database disabled")
         
    doc_ref = db.collection("medicines").document(mid)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Medicine {mid} not found")

    doc_ref.update({
        "status": status,
        "updated_at": time.time()
    })
    return {"status": "success"}

@router.delete("/medicines/{mid}")
def delete_medicine(mid: str):
    if db is None:
        raise HTTPException(status_code=500, detail="Database disabled")
    
    db.collection("medicines").document(mid).delete()
    return {"status": "success"}



# --- Events & Dashboard ---

@router.post("/events")
async def receive_event(payload: EventPayload, background_tasks: BackgroundTasks):
    if db is not None:
        alert_data = payload.dict()
        aid = str(uuid.uuid4())
        alert_data["aid"] = aid
        db.collection("alerts").document(aid).set(alert_data)
    
    # Process push notification
    background_tasks.add_task(process_event, payload.dict())
    return {"status": "success", "message": "Event recorded"}

@router.post("/emergency")
async def trigger_emergency(payload: EmergencyPayload, background_tasks: BackgroundTasks):
    alert_payload = {
        "source": "Elder_App",
        "event_type": "SOS",
        "confidence": 1.0,
        "timestamp": time.time(),
        "elder_id": payload.user_id,
        "metadata": {"lat": payload.lat, "lng": payload.lng}
    }
    
    if db is not None:
        aid = str(uuid.uuid4())
        alert_payload["aid"] = aid
        db.collection("alerts").document(aid).set(alert_payload)
        
    background_tasks.add_task(process_event, alert_payload)
    return {"status": "success", "message": "Emergency simulated call initiated."}

@router.delete("/alerts/{aid}")
def delete_alert(aid: str):
    if db is None:
        raise HTTPException(status_code=500, detail="Database disabled")
    
    db.collection("alerts").document(aid).delete()
    return {"status": "success"}



@router.get("/caregiver/dashboard/{manager_id}")
def get_dashboard(manager_id: str):
    try:
        if db is None:
            return {"isOffline": True}
            
        # Find elder
        user_doc = db.collection("users").document(manager_id).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="Manager not found")
            
        elder_data = user_doc.to_dict()
        elder_id = elder_data.get("managed_elder_id")
        
        if not elder_id:
            return {"recent_alerts": [], "daily_summary": {}, "no_elder": True}
            
        # Aggregate data - Fetch alerts without order_by to avoid index requirement
        print(f"Loading dashboard for elder: {elder_id}")
        alerts_docs = db.collection("alerts").where("elder_id", "==", elder_id).limit(20).get()
        alerts = [a.to_dict() for a in alerts_docs]
        
        # Sort in memory
        alerts.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        
        meds_docs = db.collection("medicines").where("elder_id", "==", elder_id).get()
        meds = []
        
        # --- Auto-Missed Logic ---
        from datetime import datetime
        now = datetime.now()
        current_minutes = now.hour * 60 + now.minute
        
        for doc in meds_docs:
            m = doc.to_dict()
            status = m.get("status", "pending")
            
            if status == "pending":
                # Parse "08:00 AM" or "08:00AM"
                time_str = m.get("time", "").upper().replace(" ", "")
                try:
                    # Very simple parse: "HH:MMAM"
                    dt = datetime.strptime(time_str, "%I:%M%p")
                    med_minutes = dt.hour * 60 + dt.minute
                    
                    # If current time is > 5 mins past scheduled time
                    if current_minutes > (med_minutes + 5):
                        print(f"Auto-marking {m.get('name')} as MISSED")
                        status = "missed"
                        db.collection("medicines").document(m['mid']).update({"status": "missed"})
                        m["status"] = "missed"
                except Exception as te:
                    print(f"Time parse error for {time_str}: {te}")
            
            meds.append(m)
        
        taken = len([m for m in meds if m.get("status") == "taken"])
        missed = len([m for m in meds if m.get("status") == "missed"])
        
        # Calculate falls from alerts
        falls = len([a for a in alerts if a.get("event_type") == "fall"])
        
        return {
            "isOffline": False,
            "elder_id": elder_id,
            "recent_alerts": alerts[:10],
            "medicines": meds,
            "daily_summary": {
                "falls": falls,
                "active_minutes": 45,
                "water_intake_ml": 1200,
                "medicine_taken": taken,
                "medicine_missed": missed
            }
        }
    except Exception as e:
        print("CRITICAL ERROR IN DASHBOARD ROUTE:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
