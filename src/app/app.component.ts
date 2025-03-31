import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { WeatherServicesService } from './service/weather-services.service';
import { AdvancedWeatherService } from './service/advanced-weather.service';
import { WeatherData } from './models/current-weather';
import { DailyForecast, HourlyForecast } from './models/forecast';
import { Subscription, BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'weatherApp';
  
  // Weather data
  currentWeather: WeatherData | null = null;
  hourlyForecast: HourlyForecast[] = [];
  dailyForecast: DailyForecast[] = [];
  weatherInsights: any[] = [];
  
  // Location management
  currentLocationCity = 'Hyderabad'; // Default, would be detected in a real app
  city = 'Hyderabad';
  
  // Loading states
  loading = false;
  forecastLoading = false;
  error = '';
  forecastError = '';
  
  // Data subjects for sharing with child components
  currentWeatherSubject = new BehaviorSubject<WeatherData | null>(null);
  hourlyForecastSubject = new BehaviorSubject<HourlyForecast[]>([]);
  dailyForecastSubject = new BehaviorSubject<DailyForecast[]>([]);
  weatherInsightsSubject = new BehaviorSubject<any[]>([]);
  
  // Observable streams
  currentWeather$ = this.currentWeatherSubject.asObservable();
  hourlyForecast$ = this.hourlyForecastSubject.asObservable();
  dailyForecast$ = this.dailyForecastSubject.asObservable();
  weatherInsights$ = this.weatherInsightsSubject.asObservable();
  
  private subscriptions: Subscription[] = [];
  
  constructor(
    private weatherService: WeatherServicesService,
    private advancedWeatherService: AdvancedWeatherService
  ) {}
  
  ngOnInit() {
    this.loadWeatherData(this.city);
  }
  
  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  loadWeatherData(city: string) {
    this.loading = true;
    this.error = '';
    this.forecastLoading = true;
    this.forecastError = '';
    
    // Load current weather
    const weatherSub = this.weatherService.getWeatherData(city).subscribe({
      next: (data) => {
        this.currentWeather = data;
        this.currentWeatherSubject.next(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching weather data', err);
        this.error = 'Failed to load weather data. Please try again.';
        this.loading = false;
      }
    });
    
    // Load forecast data
    const forecastSub = this.weatherService.getForecastData(city).subscribe({
      next: (data) => {
        if (data) {
          this.hourlyForecast = data.hourly;
          this.dailyForecast = data.daily;
          
          // Update subjects
          this.hourlyForecastSubject.next(data.hourly);
          this.dailyForecastSubject.next(data.daily);
          
          // Generate insights
          this.weatherInsights = this.advancedWeatherService.generateWeatherInsights(
            data.hourly,
            data.daily
          );
          this.weatherInsightsSubject.next(this.weatherInsights);
          
          this.forecastLoading = false;
        }
      },
      error: (err) => {
        console.error('Error fetching forecast data', err);
        this.forecastError = 'Failed to load forecast data. Please try again.';
        this.forecastLoading = false;
      }
    });
    
    this.subscriptions.push(weatherSub, forecastSub);
  }
  
  // Method to update city (called from search component)
  updateCity(city: string) {
    this.city = city;
    this.loadWeatherData(city);
  }
  
  // Method to reset to current location
  resetToCurrentLocation() {
    this.city = this.currentLocationCity;
    this.loadWeatherData(this.currentLocationCity);
  }
}
