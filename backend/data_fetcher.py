import requests
import os
from dotenv import load_dotenv

load_dotenv()

class DataFetcher:
    def __init__(self):
        self.owm_key = os.getenv("OPENWEATHER_API_KEY")
        self.headers = {"User-Agent": os.getenv("USER_AGENT")}

    def get_lat_lon(self, city_name: str):
        """Nominatim API for Geocoding"""
        url = f"https://nominatim.openstreetmap.org/search?city={city_name}&format=json"
        res = requests.get(url, headers=self.headers).json()
        if not res: return None
        return float(res[0]['lat']), float(res[0]['lon'])

    def get_weather_and_dust(self, lat, lon):
        """Open-Meteo for Temp, Humidity, Wind, and Dust (PM10)"""
        # Weather data
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
        # Air Quality data (Dust/PM10)
        aq_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=pm10"
        
        w_res = requests.get(weather_url).json()['current']
        aq_res = requests.get(aq_url).json()['current']
        
        # Note: Open-Meteo natively returns Temp in °C, Wind in km/h, Dust in μg/m³
        return {
            "temp": w_res['temperature_2m'],
            "humidity": w_res['relative_humidity_2m'],
            "wind": w_res['wind_speed_10m'],
            "dust": aq_res['pm10']
        }

    def get_pollutants(self, lat, lon):
        """OpenWeatherMap for SO2, NO2, CO"""
        url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={self.owm_key}"
        res = requests.get(url).json()
        components = res['list'][0]['components']
        
        # Note: OpenWeatherMap natively returns these in μg/m³
        return {
            "so2": components['so2'],
            "no2": components['no2'],
            "co": components['co']
        }