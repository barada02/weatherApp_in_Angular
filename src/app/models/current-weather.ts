export interface WeatherData {
    city: string;
    temperature: number;
    description: string;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    cloudCover: number;
    uvIndex: number;
    weatherCode: number;
    weatherIcon: string;
  }

  export interface TomorrowApiResponse {
    data: {
      time: string;
      values: {
        temperature: number;
        humidity: number;
        windSpeed: number;
        precipitationProbability: number;
        cloudCover: number;
        uvIndex: number;
        weatherCode: number;
      };
    };
    location: {
      name: string;
    };
  }
  
  export const WEATHER_CODES = {
    1000: "Clear",
    1001: "Cloudy",
    1100: "Mostly Clear",
    1101: "Partly Cloudy",
    1102: "Mostly Cloudy",
    2000: "Fog",
    2100: "Light Fog",
    4000: "Drizzle",
    4001: "Drizzle Rain",
    4200: "Light Rain",
    4201: "Heavy Rain",
    5000: "Snow",
    5001: "Light Thunder",
    8000: "Mostly Sunny"
  };
  
  export const WEATHER_ICONS = {
    1000: '☀️', // Clear
    1001: '☁️', // Cloudy
    1100: '🌤️', // Mostly Clear
    1101: '⛅', // Partly Cloudy
    1102: '🌥️', // Mostly Cloudy
    2000: '🌫️', // Fog
    2100: '🌫️', // Light Fog
    4000: '🌦️', // Drizzle
    4001: '🌧️', // Drizzle Rain
    4200: '🌧️', // Light Rain
    4201: '🌧️', // Heavy Rain
    5000: '❄️', // Snow
    5001: '⛈️', // Light Thunder
    8000: '☀️', // Mostly Sunny
  };