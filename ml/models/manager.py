class ModelManager:
    """
    Pluggable abstraction layer for ML Edge Models.
    Allows easy addition/removal of models inside the video pipeline.
    """
    def __init__(self):
        self.models = []

    def register_model(self, model):
        self.models.append(model)
        print(f"Registered model: {model.__class__.__name__}")

    def process_frame(self, frame):
        """
        Passes the current camera frame to all registered models.
        Each model returns a list of events if triggered.
        """
        events = []
        for model in self.models:
            # Models must implement a 'process' method
            result_events = model.process(frame)
            if result_events:
                events.extend(result_events)
        return events
