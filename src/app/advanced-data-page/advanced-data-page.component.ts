import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe, DatePipe, TitleCasePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeatherServicesService } from '../service/weather-services.service';
import { AdvancedWeatherService } from '../service/advanced-weather.service';
import { WeatherData } from '../models/current-weather';
import { DailyForecast, HourlyForecast } from '../models/forecast';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-advanced-data-page',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, DecimalPipe, DatePipe, TitleCasePipe, FormsModule, BaseChartDirective],
  templateUrl: './advanced-data-page.component.html',
  styleUrls: ['./advanced-data-page.component.css']
})
export class AdvancedDataPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  // Weather data
  currentWeather: WeatherData | null = null;
  hourlyForecast: HourlyForecast[] = [];
  dailyForecast: DailyForecast[] = [];
  weatherInsights: any[] = [];
  
  // UI state
  loading = false;
  error = '';
  selectedCity = 'Hyderabad';
  selectedMetric = 'temperature';
  selectedTimeRange = '24h';
  generatingReport = false;
  reportSuccess = false;
  reportError = false;
  
  // Chart configuration
  public chartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [],
        label: 'Temperature',
        backgroundColor: 'rgba(255, 222, 89, 0.2)',
        borderColor: 'rgba(255, 222, 89, 1)',
        fill: 'origin',
        tension: 0.4,
        pointBackgroundColor: 'rgba(255, 222, 89, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 222, 89, 1)',
        pointRadius: 4,
      },
    ],
    labels: []
  };
  
  public chartOptions: ChartConfiguration['options'] = {
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
            size: 10
          },
          maxRotation: 0,
          padding: 0
        },
        offset: false,
        border: {
          display: false
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 10
          },
          padding: 3
        },
        beginAtZero: true,
        border: {
          display: false
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
            size: 12
          },
          padding: 5,
          boxWidth: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 8,
        displayColors: false
      }
    },
    animation: {
      duration: 1000
    },
    layout: {
      padding: {
        top: 0,
        right: 5,
        bottom: 15,
        left: 5
      }
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 5
      },
      line: {
        tension: 0.4
      }
    }
  };
  
  public chartType: ChartType = 'line';
  
  private subscriptions: Subscription[] = [];
  
  constructor(
    private weatherService: WeatherServicesService,
    private advancedWeatherService: AdvancedWeatherService,
    private appComponent: AppComponent
  ) {
    // Register all Chart.js components
    Chart.register(...registerables);
  }
  
  ngOnInit() {
    // Subscribe to data from the AppComponent
    this.subscriptions.push(
      this.appComponent.currentWeather$.subscribe(data => {
        this.currentWeather = data;
        this.loading = this.appComponent.loading;
        this.error = this.appComponent.error;
      }),
      
      this.appComponent.hourlyForecast$.subscribe(data => {
        this.hourlyForecast = data;
        if (data.length > 0) {
          this.updateChartData();
        }
      }),
      
      this.appComponent.dailyForecast$.subscribe(data => {
        this.dailyForecast = data;
      }),
      
      this.appComponent.weatherInsights$.subscribe(data => {
        this.weatherInsights = data;
      })
    );
    
    // Initialize with the current city from the app component
    this.selectedCity = this.appComponent.city;
  }
  
  ngAfterViewInit() {
    if (this.hourlyForecast.length > 0) {
      this.updateChartData();
    }
  }
  
  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  onCityChange() {
    // Update the city in the app component to trigger data refresh
    this.appComponent.updateCity(this.selectedCity);
  }
  
  onMetricChange() {
    this.updateChartData();
  }
  
  onTimeRangeChange() {
    this.updateChartData();
  }
  
  updateChartData() {
    if (this.hourlyForecast.length === 0) return;
    
    let hours: HourlyForecast[] = [];
    
    // Filter data based on selected time range
    switch (this.selectedTimeRange) {
      case '24h':
        hours = this.hourlyForecast.slice(0, 24);
        break;
      case '48h':
        hours = this.hourlyForecast.slice(0, 48);
        break;
      case '7d':
        // For 7 days, we'll take every 6th hour to avoid overcrowding
        hours = this.hourlyForecast.filter((_, index) => index % 6 === 0).slice(0, 28);
        break;
      default:
        hours = this.hourlyForecast.slice(0, 24);
    }
    
    const chartLabels = hours.map(h => this.formatTime(h.time));
    let chartData: number[] = [];
    let label = '';
    let color = '';
    
    // Set data based on selected metric
    switch (this.selectedMetric) {
      case 'temperature':
        chartData = hours.map(h => h.temperature);
        label = 'Temperature (\u00b0C)';
        color = 'rgba(255, 222, 89, 1)'; // Yellow
        break;
      case 'precipitation':
        chartData = hours.map(h => h.precipitation);
        label = 'Precipitation (%)';
        color = 'rgba(100, 181, 246, 1)'; // Blue
        break;
      case 'wind':
        chartData = hours.map(h => h.windSpeed);
        label = 'Wind (km/h)';
        color = 'rgba(129, 199, 132, 1)'; // Green
        break;
      case 'humidity':
        chartData = hours.map(h => h.humidity);
        label = 'Humidity (%)';
        color = 'rgba(186, 104, 200, 1)'; // Purple
        break;
      default:
        chartData = hours.map(h => h.temperature);
        label = 'Temperature (\u00b0C)';
        color = 'rgba(255, 222, 89, 1)';
    }
    
    // Create a new dataset to force update
    this.chartData = {
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
    
    // Update chart options based on selected metric
    const options = { ...this.chartOptions };
    
    // Adjust y-axis based on data type
    if (this.selectedMetric === 'temperature') {
      if (options.scales && options.scales['y']) {
        options.scales['y']['min'] = Math.floor(Math.min(...chartData) - 5);
        options.scales['y']['max'] = Math.ceil(Math.max(...chartData) + 5);
      }
    } else if (this.selectedMetric === 'precipitation' || this.selectedMetric === 'humidity') {
      if (options.scales && options.scales['y']) {
        options.scales['y']['min'] = 0;
        options.scales['y']['max'] = 100;
      }
    } else if (this.selectedMetric === 'wind') {
      if (options.scales && options.scales['y']) {
        options.scales['y']['min'] = 0;
        options.scales['y']['max'] = Math.ceil(Math.max(...chartData) * 1.2);
      }
    }
    
    this.chartOptions = options;
    
    if (this.chart) {
      this.chart.update();
    }
  }
  
  generateReport() {
    if (!this.currentWeather || this.hourlyForecast.length === 0 || this.dailyForecast.length === 0) {
      this.reportError = true;
      setTimeout(() => this.reportError = false, 3000);
      return;
    }
    
    this.generatingReport = true;
    
    this.advancedWeatherService.generateWeatherReport(
      this.selectedCity,
      this.currentWeather,
      this.hourlyForecast,
      this.dailyForecast
    ).subscribe({
      next: (blob) => {
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.selectedCity.replace(' ', '_')}_Weather_Report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        
        this.generatingReport = false;
        this.reportSuccess = true;
        setTimeout(() => this.reportSuccess = false, 3000);
      },
      error: (err) => {
        console.error('Error generating report', err);
        this.generatingReport = false;
        this.reportError = true;
        setTimeout(() => this.reportError = false, 3000);
      }
    });
  }
  
  // Format the time string to a more readable format
  formatTime(timeString: string): string {
    const date = new Date(timeString);
    if (this.selectedTimeRange === '7d') {
      return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit' });
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Get weather recommendation based on insights
  getRecommendation(): string {
    if (this.weatherInsights.length === 0) return '';
    
    const topInsight = this.weatherInsights[0];
    
    switch (topInsight.type) {
      case 'temperature':
        if (topInsight.title.includes('High')) {
          return 'Wear light clothing and stay hydrated.';
        } else if (topInsight.title.includes('Cool')) {
          return 'Bring a jacket or sweater with you.';
        } else if (topInsight.title.includes('Fluctuations')) {
          return 'Dress in layers to adapt to changing temperatures.';
        }
        return 'Dress appropriately for moderate temperatures.';
        
      case 'precipitation':
        return 'Bring an umbrella or raincoat with you.';
        
      case 'wind':
        return 'Secure loose items outdoors and consider windproof clothing.';
        
      case 'uv':
        return 'Apply sunscreen and wear a hat when outdoors.';
        
      default:
        return 'Check the forecast regularly for updates.';
    }
  }
}
