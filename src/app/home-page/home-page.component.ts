import { Component, OnInit } from '@angular/core';
import { WeatherServicesService } from '../service/weather-services.service';
import { WeatherData } from '../models/current-weather';
import { NgIf, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [NgIf, DecimalPipe],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {
  currentWeather: WeatherData | null = null;
  loading = false;
  error = '';
  defaultCity = 'Hyderabad';
  
  constructor(private weatherService: WeatherServicesService) {}
  
  ngOnInit() {
    this.getWeatherData(this.defaultCity);
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
  
  selectCity(city: string) {
    this.getWeatherData(city);
  }
}
