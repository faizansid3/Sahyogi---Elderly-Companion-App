import time
import random

class ActivityMockModel:
    def __init__(self, check_interval=20):
        self.check_interval = check_interval
        self.last_check_time = time.time()

    def process(self, frame):
        """
        Mocks activity detection by simply publishing a generic event every `check_interval` seconds.
        """
        events = []
        current_time = time.time()
        
        if current_time - self.last_check_time > self.check_interval:
            self.last_check_time = current_time
            activity = random.choice(["Walking", "Sitting", "Reading", "Sleeping"])
            
            print(f"--- MOCK ACTIVITY --- Detected: {activity}")
            
            events.append({
                "source": "Camera_Edge",
                "event_type": "activity",
                "confidence": 0.95,
                "timestamp": current_time,
                "metadata": {"action": activity}
            })
            
        return events
