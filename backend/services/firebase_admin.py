import os
import glob
import firebase_admin
from firebase_admin import credentials, messaging, firestore

# Initialize Firebase Admin if credentials exist
base_path = os.path.join(os.path.dirname(__file__), '..')
json_files = glob.glob(os.path.join(base_path, '*firebase-adminsdk*.json'))

firebase_enabled = False
db = None

if json_files:
    cred_path = json_files[0]
    print(f"Found {os.path.basename(cred_path)}. Firebase Push Notifications and Firestore ENABLED.")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    firebase_enabled = True
else:
    print("WARNING: firebase-adminsdk.json not found. Database features will fail.")

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
        print(f"--- MOCK FCM NOTIFICATION ---")
        print(f"To Topic: {topic}")
        print(f"Title: {title}")
        print(f"Body: {body}")
        print(f"-----------------------------")
