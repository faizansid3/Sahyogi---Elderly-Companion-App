from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from pydantic import BaseModel
from typing import Optional, List
from services.event_manager import process_event
from services.firebase_admin import db
from firebase_admin import firestore
import time
import uuid

import traceback

router = APIRouter()

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
    except Exception as e:
        print("CRITICAL ERROR IN REGISTER:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

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
         
    # status: "taken" or "missed"
    db.collection("medicines").document(mid).update({
        "status": status,
        "updated_at": time.time()
    })
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
        meds = [m.to_dict() for m in meds_docs]
        
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
