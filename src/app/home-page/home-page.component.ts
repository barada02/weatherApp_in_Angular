import { Component, OnInit } from '@angular/core';
import { WeatherServicesService } from '../service/weather-services.service';
import { WeatherData } from '../models/current-weather';
import { NgIf, DecimalPipe, NgFor, NgClass, NgSwitch, NgSwitchCase } from '@angular/common';
import { DailyForecast, HourlyForecast } from '../models/forecast';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [NgIf, DecimalPipe, NgFor, NgClass, NgSwitch, NgSwitchCase],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {
  currentWeather: WeatherData | null = null;
  hourlyForecast: HourlyForecast[] = [];
  dailyForecast: DailyForecast[] = [];
  loading = false;
  forecastLoading = false;
  error = '';
  forecastError = '';
  defaultCity = 'Hyderabad';
  activeTab = 'temperature'; // Default selected tab
  
  constructor(private weatherService: WeatherServicesService) {}
  
  ngOnInit() {
    this.getWeatherData(this.defaultCity);
    this.getForecastData(this.defaultCity);
  }
  
  getWeatherData(city: string) {
    this.loading = true;
    this.error = '';
    
    this.weatherService.getWeatherData(city).subscribe({
      next: (data) => {
        this.currentWeather = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching weather data', err);
        this.error = 'Failed to load weather data. Please try again.';
        this.loading = false;
      }
    });
  }
  
  getForecastData(city: string) {
    this.forecastLoading = true;
    this.forecastError = '';
    
    this.weatherService.getForecastData(city).subscribe({
      next: (data) => {
        if (data) {
          this.hourlyForecast = data.hourly.slice(0, 24); // Get first 24 hours
          this.dailyForecast = data.daily;
          this.forecastLoading = false;
        }
      },
      error: (err) => {
        console.error('Error fetching forecast data', err);
        this.forecastError = 'Failed to load forecast data.';
        this.forecastLoading = false;
      }
    });
  }
  
  selectCity(city: string) {
    this.getWeatherData(city);
    this.getForecastData(city);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // Get the maximum value for the active metric to scale the chart
  getMaxValue(): number {
    if (!this.hourlyForecast.length) return 100;
    
    switch(this.activeTab) {
      case 'temperature':
        return Math.max(...this.hourlyForecast.map(h => h.temperature)) + 5; // Add some padding
      case 'precipitation':
        return 100; // Percentage is always 0-100
      case 'wind':
        return Math.max(...this.hourlyForecast.map(h => h.windSpeed)) + 5;
      default:
        return 100;
    }
  }

  // Get the value for the current metric
  getValue(forecast: HourlyForecast): number {
    switch(this.activeTab) {
      case 'temperature':
        return forecast.temperature;
      case 'precipitation':
        return forecast.precipitation;
      case 'wind':
        return forecast.windSpeed;
      default:
        return 0;
    }
  }

  // Get the height percentage for the chart
  getHeightPercentage(forecast: HourlyForecast): number {
    const maxValue = this.getMaxValue();
    const value = this.getValue(forecast);
    return (value / maxValue) * 100;
  }

  // Format the time string to a more readable format
  formatTime(timeString: string): string {
    const date = new Date(timeString);
    return date.getHours() + ':00';
  }
}
