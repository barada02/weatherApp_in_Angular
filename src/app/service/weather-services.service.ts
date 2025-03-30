import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of, BehaviorSubject } from 'rxjs';
import { WeatherData, TomorrowApiResponse, WEATHER_CODES, WEATHER_ICONS } from '../models/current-weather';
import { ForecastResponse, DailyForecast, HourlyForecast } from '../models/forecast';
import { environment } from '../../environments/environment.local';

@Injectable({
  providedIn: 'root'
})
export class WeatherServicesService {

  constructor(private http: HttpClient) { }

  private apiKey = environment.tomorrowIoApiKey;
  private apiUrl = 'https://api.tomorrow.io/v4/weather/realtime';
  private forecastUrl = 'https://api.tomorrow.io/v4/weather/forecast';

  getWeatherData(city: string): Observable<WeatherData | null> {
    const headers = new HttpHeaders().set('apikey', this.apiKey);
    const params = new HttpParams()
      .set('location', city)
      .set('units', 'metric');

    return this.http.get<TomorrowApiResponse>(this.apiUrl, { headers, params }).pipe(
      map(response => {
        if (!response || !response.data || !response.data.values) {
          return null;
        }

        const weatherCode = response.data.values.weatherCode || 1000; // Default to Clear if no code
        
        return {
          city: response.location.name,
          temperature: response.data.values.temperature,
          description: WEATHER_CODES[weatherCode as keyof typeof WEATHER_CODES] || 'Unknown',
          humidity: response.data.values.humidity,
          windSpeed: response.data.values.windSpeed,
          precipitation: response.data.values.precipitationProbability,
          cloudCover: response.data.values.cloudCover,
          uvIndex: response.data.values.uvIndex,
          weatherCode: weatherCode,
          weatherIcon: WEATHER_ICONS[weatherCode as keyof typeof WEATHER_ICONS] || '❓'
        };
      }),
      catchError(error => {
        console.error('Error fetching weather:', error);
        return of(null);
      })
    );
  }

  getForecastData(city: string): Observable<{ daily: DailyForecast[], hourly: HourlyForecast[] } | null> {
    const headers = new HttpHeaders().set('apikey', this.apiKey);
    const params = new HttpParams()
      .set('location', city)
      .set('units', 'metric');

    return this.http.get<ForecastResponse>(this.forecastUrl, { headers, params }).pipe(
      map(response => {
        if (!response.timelines.daily || !response.timelines.hourly) {
          throw new Error('Missing timeline data');
        }

        const dailyForecast = response.timelines.daily.map(day => {
          const weatherCode = day.values.weatherCode || 1000;
          return {
            date: day.time,
            temperature: day.values.temperatureAvg ?? day.values.temperature ?? 0,
            temperatureMin: day.values.temperatureMin ?? 0,
            temperatureMax: day.values.temperatureMax ?? 0,
            humidity: day.values.humidityAvg ?? day.values.humidity ?? 0,
            precipitation: day.values.precipitationProbabilityAvg ?? day.values.precipitationProbability ?? 0,
            windSpeed: day.values.windSpeedAvg ?? day.values.windSpeed ?? 0,
            description: WEATHER_CODES[weatherCode as keyof typeof WEATHER_CODES] || 'Unknown',
            weatherCode: weatherCode,
            weatherIcon: WEATHER_ICONS[weatherCode as keyof typeof WEATHER_ICONS] || '❓'
          };
        });

        const hourlyForecast = response.timelines.hourly.map(hour => {
          const weatherCode = hour.values.weatherCode || 1000;
          return {
            time: hour.time,
            temperature: hour.values.temperature ?? 0,
            humidity: hour.values.humidity ?? 0,
            precipitation: hour.values.precipitationProbability ?? 0,
            windSpeed: hour.values.windSpeed ?? 0,
            description: WEATHER_CODES[weatherCode as keyof typeof WEATHER_CODES] || 'Unknown',
            weatherCode: weatherCode,
            weatherIcon: WEATHER_ICONS[weatherCode as keyof typeof WEATHER_ICONS] || '❓'
          };
        });

        return {
          daily: dailyForecast,
          hourly: hourlyForecast
        };
      }),
      catchError(error => {
        console.error('Error fetching forecast:', error);
        return of(null);
      })
    );
  }
}
