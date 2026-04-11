import requests
import threading

class ApiClient:
    def __init__(self, backend_url, endpoint):
        self.url = f"{backend_url}{endpoint}"

    def send_event(self, event_data):
        """
        Sends the payload in a non-blocking background thread so it doesn't freeze the camera frame.
        """
        def _post():
            try:
                response = requests.post(self.url, json=event_data, timeout=3)
                if response.status_code != 200:
                    print(f"API Error: failed to post event. Status: {response.status_code}")
            except Exception as e:
                print(f"API Client Exception: Failed to connect to backend {self.url} - {str(e)}")
                
        thread = threading.Thread(target=_post)
        thread.start()
