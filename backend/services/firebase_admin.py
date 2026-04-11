import os
import firebase_admin
from firebase_admin import credentials, messaging

# Initialize Firebase Admin if credentials exist
cred_path = os.path.join(os.path.dirname(__file__), '..', 'firebase-adminsdk.json')
firebase_enabled = False

if os.path.exists(cred_path):
    print("Found firebase-adminsdk.json. Firebase Push Notifications ENABLED.")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    firebase_enabled = True
else:
    print("WARNING: firebase-adminsdk.json not found. Push Notifications will be MOCKED.")

def send_push_notification(title: str, body: str, topic: str = "caregivers"):
    """
    Sends FCM Push Notification to Caregiver topic.
    Mocks the call if firebase-adminsdk is not present.
    """
    if firebase_enabled:
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                topic=topic,
            )
            response = messaging.send(message)
            print("Successfully sent message:", response)
        except Exception as e:
            print("Failed to send Firebase Push Notification:", e)
    else:
        # Mock behavior
        print(f"--- MOCK FCM NOTIFICATION ---")
        print(f"To Topic: {topic}")
        print(f"Title: {title}")
        print(f"Body: {body}")
        print(f"-----------------------------")
