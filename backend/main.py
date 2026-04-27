from fastapi import FastAPI, HTTPException
from data_fetcher import DataFetcher
from model_utils import AQIPredictor

app = FastAPI(title="Indian Cities AQI Predictor")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all websites to access your API
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize our components
fetcher = DataFetcher()
# Ensure these files are in your /models folder!
predictor = AQIPredictor("models/aqi_model.pkl", "models/scaler.pkl")

@app.get("/")
def home():
    return {"message": "AQI Prediction Backend is Running"}

@app.get("/predict/{city}")
def get_prediction(city: str):
    # 1. Get Coordinates
    coords = fetcher.get_lat_lon(city)
    if not coords:
        raise HTTPException(status_code=404, detail="City not found")
    
    lat, lon = coords
    
    try:
        # 2. Fetch API data
        weather = fetcher.get_weather_and_dust(lat, lon)
        pollutants = fetcher.get_pollutants(lat, lon)
        
        # 3. Format features for the model
        # Order: [Lat, Lon, Temp, Hum, SO2, NO2, CO, Wind, Dust]
        feature_list = [
            lat, lon, weather['temp'], weather['humidity'],
            pollutants['so2'], pollutants['no2'], pollutants['co'],
            weather['wind'], weather['dust']
        ]
        
        # 4. Predict
        aqi_value, category = predictor.predict(feature_list)
        
        return {
            "city": city,
            "coordinates": {"lat": lat, "lon": lon},
            "predicted_aqi": aqi_value,
            "category": category,
            "raw_data": {**weather, **pollutants}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)