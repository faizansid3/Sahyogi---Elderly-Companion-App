import cv2
import yaml
import time
import os
from models.manager import ModelManager
from models.fall_detection import FallDetectionModel
from models.activity_mock import ActivityMockModel
from utils.api_client import ApiClient

def load_config():
    config_path = os.path.join(os.path.dirname(__file__), '..', 'configs', 'models.yaml')
    with open(config_path, 'r') as file:
        return yaml.safe_load(file)

def main():
    print("Initializing Sahyogi ML Pipeline...")
    config = load_config()

    # Setup API Client
    api = ApiClient(config['api']['backend_url'], config['api']['endpoints']['events'])

    # Setup Pluggable Manager
    manager = ModelManager()

    if config['models']['fall_detection']['enabled']:
        manager.register_model(FallDetectionModel(
            velocity_threshold=config['models']['fall_detection']['velocity_threshold'],
            history_frames=config['models']['fall_detection']['history_frames']
        ))
        
    if config['models']['activity']['enabled'] and config['models']['activity']['mock']:
        manager.register_model(ActivityMockModel())

    # Setup Camera Input
    cam_source = config['camera']['source']
    print(f"Connecting to camera source: {cam_source}")
    cap = cv2.VideoCapture(cam_source)
    
    if not cap.isOpened():
        print("Error: Could not open camera.")
        return

    interval_sec = config['pipeline']['interval_ms'] / 1000.0

    print("Pipeline running. Press 'q' to quit.")
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Failed to grab frame. Exiting...")
                break
                
            # Process Frame via Manager
            events = manager.process_frame(frame)
            
            # Dispatch Events
            for event in events:
                api.send_event(event)

            # Optional: Display Frame for Debugging (can be disabled in prod)
            cv2.imshow('Sahyogi Edge Camera Feed', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
            time.sleep(interval_sec)
    except KeyboardInterrupt:
        print("\nShutdown requested")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("Pipeline terminated.")

if __name__ == "__main__":
    main()
