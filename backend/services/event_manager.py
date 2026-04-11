from services.firebase_admin import send_push_notification

def process_event(event_data: dict):
    """
    Background worker function to process ML events.
    Checks severity and triggers required actions (Push Notification, API call to remote service, etc).
    """
    event_type = event_data.get("event_type")
    
    if event_type == "fall":
        print(f"CRITICAL WARNING: Fall detected! Processing alert for caregivers.")
        title = "CRITICAL ALERT: Fall Detected!"
        body = "Sahyogi detected a potential fall. Please check the camera immediately."
        send_push_notification(title, body)
        
    elif event_type == "SOS":
        print(f"EMERGENCY: User pressed SOS button in App. Simulating calling family and EMS...")
        title = "EMERGENCY: SOS Button Activated"
        body = "Elder has pressed the emergency button. Tap for more info."
        send_push_notification(title, body)
        
    elif event_type == "activity":
        print(f"INFO: Activity detected: {event_data.get('metadata')}")
        # Could save to DB without push notification
