# Sahyogi - AI-Powered Elderly Monitoring System

Sahyogi (Hindi for Companion) is a comprehensive, modular system designed to ensure the safety and well-being of the elderly. It consists of three primary components:
1. **Edge ML Pipeline**: A local Python script using a camera to detect falls and track activity.
2. **Backend Server**: A FastAPI service routing events and triggering notifications.
3. **Mobile App**: A React Native application for Caregivers (Dashboard) and Elders (Minimal UI + Voice Assistant).

## Project Structure

```text
├── backend/ # FastAPI server and API routes
├── configs/ # Centralized configurations (models.yaml, .env)
├── frontend/ # React Native (Expo) mobile application
└── ml/ # Pluggable edge ML pipeline (Fall detection, Activity)
```

## Setup Instructions

### 1. Backend (FastAPI)
The backend acts as the central hub routing ML events to the mobile app via Firebase.

1. Navigate to the backend directory: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Place your `firebase-adminsdk.json` in the `backend/` directory if you wish to use real FCM push notifications.
6. Run the server: `uvicorn main:app --reload`
   - The server will start on `http://localhost:8000`

### 2. Edge ML Pipeline
The ML pipeline runs locally on an edge device or PC with a camera attached.

1. Navigate to the ML directory: `cd ml`
2. Create a virtual environment (or use the backend's): `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Install dependencies (`opencv-python`, `mediapipe`, `requests`, `pyyaml`).
5. Run the pipeline: `python run_pipeline.py`

### 3. Frontend App (React Native/Expo)
The front end is built with Expo. You'll need Node.js installed.

1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the Expo development server: `npx expo start`
4. Scan the QR Code using the Expo Go app on your physical Android device, or press `a` to run on an Android emulator.

## Environment Variables
Copy `configs/.env.example` to `configs/.env` and update the values.
- `API_BASE_URL`: The URL where the FastAPI backend is hosted.
- `GEMINI_API_KEY`: API key for the LLM voice assistant fallback.

## Demo Instructions
1. Start the FastAPI backend.
2. Start the Frontend app and login/enter as a Caregiver to see the Dashboard.
3. Start the ML pipeline script while facing your webcam. Simulate a fall (e.g., lower your shoulders/head rapidly in frame).
4. The backend terminal should print an alert, and your App should update the UI with a Push / In-App Notification. 
