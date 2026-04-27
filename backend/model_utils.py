import joblib
import numpy as np
import warnings

# Suppress the specific warning about feature names
warnings.filterwarnings("ignore", message="X does not have valid feature names")

class AQIPredictor:
    def __init__(self, model_path, scaler_path):
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)

    def predict(self, features: list):
        # features: [lat, lon, temp, hum, so2, no2, co, wind, dust]
        data = np.array([features])
        
        # Suppress warnings specific to this block if needed, but global filter above handles it
        scaled_data = self.scaler.transform(data)
        
        # Predict in Log scale and convert back
        log_pred = self.model.predict(scaled_data)[0]
        actual_aqi = np.expm1(log_pred)
        
        # Categorize
        if actual_aqi <= 50: cat = "Good"
        elif actual_aqi <= 100: cat = "Moderate"
        elif actual_aqi <= 150: cat = "Unhealthy for Sensitive Groups"
        elif actual_aqi <= 200: cat = "Unhealthy"
        elif actual_aqi <= 300: cat = "Very Unhealthy"
        else: cat = "Hazardous"
        
        return round(actual_aqi, 2), cat