import joblib
import os

def export_model(model, filename="exports/model.pkl"):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    joblib.dump(model, filename)
    return {"status": "success", "path": filename}
