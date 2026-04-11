import os
import glob
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin
base_path = os.path.dirname(os.path.abspath(__file__))
json_files = glob.glob(os.path.join(base_path, '..', '*firebase-adminsdk*.json'))

if not json_files:
    print("NO JSON FOUND")
    exit(1)

cred = credentials.Certificate(json_files[0])
try:
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firestore client initialized successfully")
    
    # Test a simple query syntax
    print("Testing query syntax...")
    try:
        # Standard syntax
        res = db.collection("users").where("email", "==", "test@example.com").get()
        print("Standard where() successful")
    except Exception as e:
        print(f"Standard where() failed: {e}")

    try:
        # Filter syntax
        from google.cloud.firestore_v1.base_query import FieldFilter
        res = db.collection("users").where(filter=FieldFilter("email", "==", "test@example.com")).get()
        print("FieldFilter successful")
    except Exception as e:
        print(f"FieldFilter failed: {e}")

except Exception as e:
    print(f"Initialization failed: {e}")
