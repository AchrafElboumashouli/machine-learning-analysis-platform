import joblib


class BaseModel:
    """
    Unified base class for all ML models
    """

    def __init__(self, name: str):
        self.name = name
        self.model = None

    # ==============================
    # TRAIN
    # ==============================
    def fit(self, X, y=None):
        raise NotImplementedError

    # ==============================
    # PREDICT
    # ==============================
    def predict(self, X):
        raise NotImplementedError

    # ==============================
    # GET RAW MODEL
    # ==============================
    def get_model(self):
        return self.model

    # ==============================
    # SAVE MODEL
    # ==============================
    def save(self, path: str):
        joblib.dump(self.model, path)

    # ==============================
    # LOAD MODEL
    # ==============================
    def load(self, path: str):
        self.model = joblib.load(path)
