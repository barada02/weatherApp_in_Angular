import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { WeatherServicesService } from '../service/weather-services.service';
import { WeatherData } from '../models/current-weather';
import { NgIf, DecimalPipe, NgFor, NgClass, NgSwitch, NgSwitchCase } from '@angular/common';
import { DailyForecast, HourlyForecast } from '../models/forecast';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartEvent, ChartType, registerables } from 'chart.js';
import { default as Annotation } from 'chartjs-plugin-annotation';
import { CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { FavoriteCitiesService, FavoriteCity } from '../service/favorite-cities.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [NgIf, DecimalPipe, NgFor, NgClass, NgSwitch, NgSwitchCase, BaseChartDirective, FormsModule],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  currentWeather: WeatherData | null = null;
  hourlyForecast: HourlyForecast[] = [];
  dailyForecast: DailyForecast[] = [];
  loading = false;
  forecastLoading = false;
  error = '';
  forecastError = '';
  defaultCity = 'Hyderabad';
  activeTab = 'temperature'; // Default selected tab
  
  // Chart configuration
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [],
        label: 'Temperature',
        backgroundColor: 'rgba(255, 222, 89, 0.2)',
        borderColor: 'rgba(255, 222, 89, 1)',
        fill: 'origin',
        tension: 0.4, // makes the line curved
        pointBackgroundColor: 'rgba(255, 222, 89, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 222, 89, 1)',
        pointRadius: 4,
      },
    ],
    labels: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 10 // Smaller font size for x-axis labels
          },
          maxRotation: 0, // Prevent label rotation
          padding: 0 // Reduce padding
        },
        offset: false, // Remove offset
        border: {
          display: false // Hide border
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 10 // Smaller font size for y-axis labels
          },
          padding: 3 // Reduce padding
        },
        beginAtZero: true,
        border: {
          display: false // Hide border
        }
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12 // Smaller legend font size
          },
          padding: 5, // Reduce padding
          boxWidth: 12 // Smaller legend box
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 8,
        displayColors: false // Hide color boxes in tooltip
      }
    },
    animation: {
      duration: 1000
    },
    layout: {
      padding: {
        top: 0,
        right: 5,
        bottom: 15, // Add more padding at bottom for x-axis labels
        left: 5
      }
    },
    elements: {
      point: {
        radius: 3, // Smaller points
        hoverRadius: 5 // Slightly larger on hover
      },
      line: {
        tension: 0.4 // Smooth curves
      }
    }
  };

  public lineChartType: ChartType = 'line';
  
  // Favorite cities
  favoriteCities: FavoriteCity[] = [];
  newCityName = '';
  private citiesSubscription: Subscription | null = null;

  constructor(
    private weatherService: WeatherServicesService,
    private favoriteCitiesService: FavoriteCitiesService,
    private cdr: ChangeDetectorRef
  ) {
    // Register all Chart.js components
    Chart.register(Annotation, ...registerables);
  }
  
  ngOnInit() {
    console.log('HomePageComponent initialized');
    this.getWeatherData(this.defaultCity);
    this.getForecastData(this.defaultCity);
    
    // Subscribe to favorite cities
    this.citiesSubscription = this.favoriteCitiesService.favoriteCities$.subscribe(cities => {
      this.favoriteCities = cities;
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit() {
    // Initial chart update after view is initialized
    if (this.hourlyForecast.length > 0) {
      this.updateChartData();
    }
  }
  
  ngOnDestroy() {
    // Clean up subscription
    if (this.citiesSubscription) {
      this.citiesSubscription.unsubscribe();
    }
  }
  
  getWeatherData(city: string) {
    console.log('Getting weather data for city:', city);
    this.loading = true;
    this.error = '';
    
    this.weatherService.getWeatherData(city).subscribe({
      next: (data) => {
        console.log('Weather data received:', data);
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
    console.log('Getting forecast data for city:', city);
    this.forecastLoading = true;
    this.forecastError = '';
    
    this.weatherService.getForecastData(city).subscribe({
      next: (data) => {
        console.log('Forecast data received:', data);
        if (data) {
          this.hourlyForecast = data.hourly.slice(0, 24); // Get first 24 hours
          this.dailyForecast = data.daily;
          this.forecastLoading = false;
          console.log('Hourly forecast data set:', this.hourlyForecast);
          this.updateChartData();
          this.cdr.detectChanges(); // Force change detection
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
    this.updateChartData();
  }

  // Update chart data based on active tab
  updateChartData() {
    console.log('updateChartData called. Hourly forecast length:', this.hourlyForecast.length);
    if (this.hourlyForecast.length === 0) {
      console.log('No hourly forecast data available');
      return;
    }

    try {
      const hours8 = this.hourlyForecast.slice(0, 8);
      const chartLabels = hours8.map(h => this.formatTime(h.time));
      let chartData: number[] = [];
      let label = '';
      let color = '';
      
      switch(this.activeTab) {
        case 'temperature':
          chartData = hours8.map(h => h.temperature);
          label = 'Temperature (°C)';
          color = 'rgba(255, 222, 89, 1)'; // Yellow
          break;
        case 'precipitation':
          chartData = hours8.map(h => h.precipitation);
          label = 'Precipitation (%)';
          color = 'rgba(100, 181, 246, 1)'; // Blue
          break;
        case 'wind':
          chartData = hours8.map(h => h.windSpeed);
          label = 'Wind (km/h)';
          color = 'rgba(129, 199, 132, 1)'; // Green
          break;
      }

      console.log('Chart data:', { labels: chartLabels, data: chartData, label });
      
      // Create a new dataset to force update
      this.lineChartData = {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          label: label,
          backgroundColor: color.replace('1)', '0.2)'),
          borderColor: color,
          fill: 'origin',
          tension: 0.4,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: color,
          pointRadius: 4,
        }]
      };

      // Update chart options based on active tab
      const options = { ...this.lineChartOptions };
      
      // Adjust y-axis based on data type
      if (this.activeTab === 'temperature') {
        // For temperature, set a reasonable min/max range
        if (options.scales && options.scales['y']) {
          options.scales['y']['min'] = Math.floor(Math.min(...chartData) - 5);
          options.scales['y']['max'] = Math.ceil(Math.max(...chartData) + 5);
        }
      } else if (this.activeTab === 'precipitation') {
        // For precipitation, 0-100%
        if (options.scales && options.scales['y']) {
          options.scales['y']['min'] = 0;
          options.scales['y']['max'] = 100;
        }
      } else if (this.activeTab === 'wind') {
        // For wind, start at 0 with reasonable max
        if (options.scales && options.scales['y']) {
          options.scales['y']['min'] = 0;
          options.scales['y']['max'] = Math.ceil(Math.max(...chartData) + 2);
        }
      }

      // Apply updated options
      this.lineChartOptions = options;

      console.log('Chart configuration:', JSON.stringify(this.lineChartData));
      console.log('Chart object exists:', !!this.chart);
      
      // Force change detection and update chart
      this.cdr.detectChanges();
      
      if (this.chart && this.chart.chart) {
        console.log('Updating chart...');
        this.chart.chart.update();
        console.log('Chart updated successfully');
      } else {
        console.warn('Chart directive not found or not initialized');
      }
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  }

  updateChartDataStyle(color: string) {
    this.lineChartData.datasets[0].backgroundColor = color.replace('1)', '0.2)');
    this.lineChartData.datasets[0].borderColor = color;
  }

  // Format the time string to a more readable format
  formatTime(timeString: string): string {
    const date = new Date(timeString);
    return date.getHours() + ':00';
  }

  // Favorite cities methods
  addFavoriteCity() {
    if (this.newCityName && this.newCityName.trim()) {
      this.favoriteCitiesService.addCity(this.newCityName.trim())
        .subscribe({
          next: (city) => {
            console.log('City added:', city);
            this.newCityName = ''; // Clear input field
          },
          error: (err) => {
            console.error('Error adding city:', err);
          }
        });
    }
  }

  removeFavoriteCity(cityId?: string) {
    if (cityId) {
      this.favoriteCitiesService.removeCity(cityId)
        .subscribe({
          next: (success) => {
            if (success) {
              console.log('City removed successfully');
            } else {
              console.error('Failed to remove city');
            }
          },
          error: (err) => {
            console.error('Error removing city:', err);
          }
        });
    }
  }
}
