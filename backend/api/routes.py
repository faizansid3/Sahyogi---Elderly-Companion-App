from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from services.event_manager import process_event
import time

router = APIRouter()

class EventPayload(BaseModel):
    source: str
    event_type: str # 'fall', 'activity', 'system'
    confidence: float
    timestamp: float
    metadata: Optional[dict] = {}

class EmergencyPayload(BaseModel):
    user_id: str
    lat: Optional[float] = None
    lng: Optional[float] = None

# In-memory storage for simple dashboard
mock_dashboard_state = {
    "recent_alerts": [],
    "daily_summary": {"falls": 0, "active_minutes": 0}
}

@router.post("/events")
async def receive_event(payload: EventPayload, background_tasks: BackgroundTasks):
    """
    Endpoint for the ML Pipeline to submit edge detection events.
    """
    if payload.event_type == "fall":
        mock_dashboard_state["recent_alerts"].append({
            "type": "Fall Detected",
            "time": time.time(),
            "confidence": payload.confidence
        })
        mock_dashboard_state["daily_summary"]["falls"] += 1
    
    # Process push notification trigger asynchronously
    background_tasks.add_task(process_event, payload.dict())
    
    return {"status": "success", "message": "Event recorded"}

@router.post("/emergency")
async def trigger_emergency(payload: EmergencyPayload, background_tasks: BackgroundTasks):
    """
    Simulated SOS Trigger from Elder's UI
    """
    alert_payload = {
        "source": "Elder_App",
        "event_type": "SOS",
        "confidence": 1.0,
        "timestamp": time.time(),
        "metadata": {"user": payload.user_id}
    }
    mock_dashboard_state["recent_alerts"].append({
        "type": "Emergency Call Triggered",
        "time": time.time(),
        "confidence": 1.0
    })
    
    background_tasks.add_task(process_event, alert_payload)
    return {"status": "success", "message": "Emergency simulated call initiated."}

@router.get("/caregiver/dashboard")
def get_dashboard():
    """
    Endpoint for Caregiver UI to poll/fetch recent metrics.
    """
    return mock_dashboard_state

@router.get("/config")
def get_config():
    """
    Client feature toggles and configs
    """
    return {
        "features": {
            "emergency_enabled": True,
            "face_recognition": False,
            "ocr": False
        }
    }
