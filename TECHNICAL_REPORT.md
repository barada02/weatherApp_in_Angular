# Weather App Technical Report

## Table of Contents

1. [Project Overview](#project-overview)
2. [File Structure](#file-structure)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Component Implementations](#component-implementations)
5. [Home Component Detailed Analysis](#home-component-detailed-analysis)
6. [Weather Data Visualization](#weather-data-visualization)
7. [Favorite Cities Implementation](#favorite-cities-implementation)
8. [Services Implementation](#services-implementation)
9. [Responsive Design](#responsive-design)
10. [Future Enhancements](#future-enhancements)

## Project Overview

The Weather App is an Angular-based application providing real-time weather information, forecasts, and personalized features. It integrates with Tomorrow.io for weather data and Firebase Realtime Database for storing user preferences. The application follows a centralized data management approach with a clean component hierarchy and reactive programming patterns.

## File Structure

The application follows a modular structure organized by feature and functionality:

```
src/
├── app/
│   ├── home-page/                  # Main weather display component
│   │   ├── home-page.component.ts
│   │   ├── home-page.component.html
│   │   └── home-page.component.css
│   ├── service/                    # Services for data management
│   │   ├── weather-services.service.ts  # Weather API service
│   │   └── favorite-cities.service.ts  # Firebase integration
│   ├── models/                     # Data models and interfaces
│   │   └── weather.model.ts
│   ├── app.component.ts            # Root component
│   ├── app.component.html
│   ├── app.component.css
│   ├── app.module.ts               # Main module declarations
│   └── app-routing.module.ts       # Routing configuration
├── assets/                         # Static assets
│   └── images/
├── environments/                   # Environment configurations
│   ├── environment.ts
│   └── environment.prod.ts
└── index.html                      # Main HTML entry
```

## Data Flow Architecture

The application implements a centralized data management approach with a unidirectional data flow:

```
┌─────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│  API Services   │────▶│    App Component  │────▶│    Child Components│
│ (Data Fetching) │     │ (Data Processing) │     │   (Data Display)  │
└─────────────────┘     └───────────────────┘     └───────────────────┘
       ▲                        │
       │                        ▼
┌─────────────────┐     ┌───────────────────┐
│    Firebase     │◀───▶│  User Interactions│
│  (Data Storage) │     │   (Events/Input)  │
└─────────────────┘     └───────────────────┘
```

Key aspects of the data flow:

1. **Centralized State Management**: The AppComponent maintains the application state, including current weather data, forecasts, and user preferences.

2. **Unidirectional Data Flow**: Data flows from services to components through inputs, while events flow from child components to parent components through outputs.

3. **Reactive Programming**: RxJS Observables are used throughout the application to handle asynchronous operations and state updates.

4. **Service-Component Communication**: Services provide data to components, and components subscribe to services for updates.

## Component Implementations

### App Component

The App Component serves as the main container for the application and coordinates data flow:

```typescript
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // Centralized data properties
  currentWeather: CurrentWeather | null = null;
  hourlyForecast: HourlyForecast[] = [];
  dailyForecast: DailyForecast[] = [];
  currentLocationCity: string = '';
  city: string = '';
  
  constructor(
    private weatherService: WeatherServicesService,
    private locationService: LocationService
  ) {}
  
  ngOnInit(): void {
    // Initialize with user's current location
    this.locationService.getCurrentLocation().subscribe(location => {
      this.currentLocationCity = location;
      this.city = location;
      this.fetchAllWeatherData();
    });
  }
  
  // Central method to fetch all weather data
  fetchAllWeatherData(): void {
    this.weatherService.getCurrentWeather(this.city).subscribe(data => {
      this.currentWeather = data;
    });
    
    this.weatherService.getHourlyForecast(this.city).subscribe(data => {
      this.hourlyForecast = data;
    });
    
    this.weatherService.getDailyForecast(this.city).subscribe(data => {
      this.dailyForecast = data;
    });
  }
  
  // Handle search events from child components
  onCitySearch(city: string): void {
    this.city = city;
    this.fetchAllWeatherData();
  }
  
  // Reset to user's current location
  resetToCurrentLocation(): void {
    this.city = this.currentLocationCity;
    this.fetchAllWeatherData();
  }
}
```

## Home Component Detailed Analysis

The Home Component is the primary UI for the weather application and consists of several sections, each handling different aspects of the weather display.

### Component Sections

1. **Search Section**:
   - Input field for city search
   - Search button
   - Current location button

```html
<!-- Search Section -->
<div class="search-container">
  <input type="text" [(ngModel)]="searchCity" placeholder="Enter city name..." (keyup.enter)="searchWeather()">
  <button (click)="searchWeather()">
    <i class="fas fa-search"></i>
  </button>
  <button (click)="useCurrentLocation()" class="location-btn">
    <i class="fas fa-map-marker-alt"></i>
  </button>
</div>
```

2. **Current Weather Section**:
   - City name and date
   - Temperature and weather icon
   - Weather conditions
   - Additional metrics (humidity, wind, etc.)

```html
<!-- Current Weather Section -->
<div class="current-weather-container">
  <div class="weather-header">
    <h2>{{ city }}</h2>
    <p>{{ currentDate | date:'EEEE, MMMM d, y' }}</p>
  </div>
  <div class="weather-main">
    <div class="temperature">
      <span>{{ currentWeather?.temperature | number:'1.0-0' }}°C</span>
    </div>
    <div class="weather-icon">
      <img [src]="getWeatherIconUrl(currentWeather?.weatherCode)" alt="Weather icon">
      <p>{{ getWeatherDescription(currentWeather?.weatherCode) }}</p>
    </div>
  </div>
  <div class="weather-details">
    <div class="detail-item">
      <i class="fas fa-tint"></i>
      <span>{{ currentWeather?.humidity }}%</span>
      <p>Humidity</p>
    </div>
    <div class="detail-item">
      <i class="fas fa-wind"></i>
      <span>{{ currentWeather?.windSpeed }} km/h</span>
      <p>Wind</p>
    </div>
    <!-- Additional weather details -->
  </div>
</div>
```

3. **Hourly Forecast Section**:
   - Interactive chart
   - Chart type selector (temperature, precipitation, wind)
   - Time navigation

```html
<!-- Hourly Forecast Section -->
<div class="hourly-forecast-container">
  <div class="chart-controls">
    <div class="chart-type-selector">
      <button [class.active]="selectedChartType === 'temperature'" (click)="changeChartType('temperature')">Temperature</button>
      <button [class.active]="selectedChartType === 'precipitation'" (click)="changeChartType('precipitation')">Precipitation</button>
      <button [class.active]="selectedChartType === 'wind'" (click)="changeChartType('wind')">Wind</button>
    </div>
  </div>
  <div class="chart-container">
    <canvas baseChart
      [data]="lineChartData"
      [options]="lineChartOptions"
      [type]="'line'">
    </canvas>
  </div>
</div>
```

4. **Favorite Cities Section**:
   - Input for adding new cities
   - List of saved favorite cities
   - Quick select and remove functionality

```html
<!-- Favorite Cities Section -->
<div class="favorite-cities-container">
  <h3>Favorite Cities</h3>
  <div class="add-city-form">
    <input type="text" [(ngModel)]="newCityName" placeholder="Add a new city..." (keyup.enter)="addFavoriteCity()">
    <button (click)="addFavoriteCity()">
      <i class="fas fa-plus"></i>
    </button>
  </div>
  <div class="favorites-list">
    <div *ngFor="let city of favoriteCities" class="favorite-city-item">
      <span (click)="selectCity(city.name)">{{ city.name }}</span>
      <button (click)="removeFavoriteCity(city.id)" class="remove-btn">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div *ngIf="favoriteCities.length === 0" class="no-favorites">
      <p>No favorite cities added yet</p>
    </div>
  </div>
</div>
```

### Home Component TypeScript Implementation

The Home Component's TypeScript implements the logic for all UI interactions and data display:

```typescript
@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit, OnDestroy {
  // Weather data properties
  currentWeather: any;
  city: string = '';
  currentDate = new Date();
  hourlyForecast: any[] = [];
  
  // Chart configuration
  selectedChartType: string = 'temperature';
  lineChartData: ChartData = {
    labels: [],
    datasets: []
  };
  lineChartOptions: ChartConfiguration['options'];
  
  // Favorite cities
  favoriteCities: FavoriteCity[] = [];
  newCityName: string = '';
  private subscription = new Subscription();
  
  constructor(
    private weatherService: WeatherServicesService,
    private favoriteCitiesService: FavoriteCitiesService
  ) {
    this.initChartOptions();
  }
  
  ngOnInit(): void {
    this.loadCurrentLocationWeather();
    this.loadFavoriteCities();
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  // Weather data loading methods
  loadCurrentLocationWeather(): void {
    // Implementation to load weather for current location
  }
  
  searchWeather(): void {
    if (this.searchCity && this.searchCity.trim()) {
      this.city = this.searchCity.trim();
      this.loadWeatherData();
    }
  }
  
  loadWeatherData(): void {
    this.weatherService.getCurrentWeather(this.city).subscribe({
      next: (data) => {
        this.currentWeather = data;
      },
      error: (err) => console.error('Error fetching current weather:', err)
    });
    
    this.weatherService.getHourlyForecast(this.city).subscribe({
      next: (data) => {
        this.hourlyForecast = data;
        this.updateChartData();
      },
      error: (err) => console.error('Error fetching hourly forecast:', err)
    });
  }
  
  // Chart methods
  initChartOptions(): void {
    this.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            font: { size: 10 }
          }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            font: { size: 10 }
          },
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: 'rgba(255, 255, 255, 0.7)',
            font: { size: 12 }
          }
        }
      }
    };
  }
  
  updateChartData(): void {
    if (!this.hourlyForecast || this.hourlyForecast.length === 0) return;
    
    const times = this.hourlyForecast.map(item => this.formatTime(item.time));
    
    let dataValues: number[] = [];
    let label: string = '';
    let borderColor: string = '';
    
    switch(this.selectedChartType) {
      case 'temperature':
        dataValues = this.hourlyForecast.map(item => item.temperature);
        label = 'Temperature (°C)';
        borderColor = 'rgba(255, 99, 132, 1)';
        break;
      case 'precipitation':
        dataValues = this.hourlyForecast.map(item => item.precipitationProbability);
        label = 'Precipitation (%)';
        borderColor = 'rgba(54, 162, 235, 1)';
        break;
      case 'wind':
        dataValues = this.hourlyForecast.map(item => item.windSpeed);
        label = 'Wind Speed (km/h)';
        borderColor = 'rgba(255, 206, 86, 1)';
        break;
    }
    
    this.lineChartData = {
      labels: times,
      datasets: [{
        data: dataValues,
        label: label,
        borderColor: borderColor,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        pointBackgroundColor: borderColor,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: borderColor,
        fill: true,
        tension: 0.4
      }]
    };
  }
  
  changeChartType(type: string): void {
    this.selectedChartType = type;
    this.updateChartData();
  }
  
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Favorite cities methods
  loadFavoriteCities(): void {
    this.subscription.add(
      this.favoriteCitiesService.favoriteCities$.subscribe(cities => {
        this.favoriteCities = cities;
      })
    );
  }
  
  addFavoriteCity(): void {
    if (this.newCityName && this.newCityName.trim()) {
      this.favoriteCitiesService.addCity(this.newCityName.trim())
        .subscribe({
          next: (city) => {
            console.log('City added:', city);
            this.newCityName = ''; // Clear input field
          },
          error: (err) => console.error('Error adding city:', err)
        });
    }
  }
  
  removeFavoriteCity(id: string): void {
    this.favoriteCitiesService.removeCity(id)
      .subscribe({
        next: () => console.log('City removed successfully'),
        error: (err) => console.error('Error removing city:', err)
      });
  }
  
  selectCity(cityName: string): void {
    this.city = cityName;
    this.searchCity = cityName;
    this.loadWeatherData();
  }
}
```

## Weather Data Visualization

The application uses Chart.js with the ng2-charts Angular wrapper to provide interactive data visualization.

### Chart Implementation

1. **Chart Configuration**: The chart is configured in the Home Component with responsive options and styling to match the application theme.

2. **Dynamic Data Updates**: When users switch between chart types (temperature, precipitation, wind), the chart updates dynamically without reloading the page.

3. **Time-based X-axis**: The chart displays hours along the x-axis, formatted for easy reading.

4. **Custom Styling**: Charts are styled with appropriate colors, grid lines, and tooltips for optimal user experience.

Key code for chart implementation:

```typescript
// Chart initialization
private initChartOptions(): void {
  this.lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { size: 10 }
        }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { size: 10 }
        },
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { size: 12 }
        }
      }
    }
  };
}

// Chart data update based on selection
updateChartData(): void {
  if (!this.hourlyForecast || this.hourlyForecast.length === 0) return;
  
  const times = this.hourlyForecast.map(item => this.formatTime(item.time));
  
  let dataValues: number[] = [];
  let label: string = '';
  let borderColor: string = '';
  
  switch(this.selectedChartType) {
    case 'temperature':
      dataValues = this.hourlyForecast.map(item => item.temperature);
      label = 'Temperature (°C)';
      borderColor = 'rgba(255, 99, 132, 1)';
      break;
    case 'precipitation':
      dataValues = this.hourlyForecast.map(item => item.precipitationProbability);
      label = 'Precipitation (%)';
      borderColor = 'rgba(54, 162, 235, 1)';
      break;
    case 'wind':
      dataValues = this.hourlyForecast.map(item => item.windSpeed);
      label = 'Wind Speed (km/h)';
      borderColor = 'rgba(255, 206, 86, 1)';
      break;
  }
  
  this.lineChartData = {
    labels: times,
    datasets: [{
      data: dataValues,
      label: label,
      borderColor: borderColor,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      pointBackgroundColor: borderColor,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: borderColor,
      fill: true,
      tension: 0.4
    }]
  };
}
```

## Favorite Cities Implementation

The favorite cities feature allows users to save and manage their preferred locations using Firebase Realtime Database.

### Firebase Integration

The `FavoriteCitiesService` handles all interactions with Firebase:

```typescript
@Injectable({
  providedIn: 'root'
})
export class FavoriteCitiesService {
  private firebaseUrl = 'https://angulartest-93e44-default-rtdb.asia-southeast1.firebasedatabase.app/cities';
  private favoriteCitiesSubject = new BehaviorSubject<FavoriteCity[]>([]);
  favoriteCities$ = this.favoriteCitiesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFavoriteCities();
  }

  // Load favorite cities from Firebase
  loadFavoriteCities(): void {
    this.http.get<{[key: string]: FavoriteCity}>(`${this.firebaseUrl}.json`)
      .pipe(
        map(response => {
          if (!response) return [];
          return Object.keys(response).map(key => ({
            ...response[key],
            id: key
          }));
        }),
        catchError(error => {
          console.error('Error loading favorite cities:', error);
          return of([]);
        })
      )
      .subscribe(cities => {
        this.favoriteCitiesSubject.next(cities);
      });
  }

  // Add a new city to favorites
  addCity(name: string): Observable<FavoriteCity> {
    const city = { name };
    
    return this.http.post<{name: string}>(`${this.firebaseUrl}.json`, city)
      .pipe(
        map(response => {
          const newCity = { ...city, id: response.name };
          const currentCities = this.favoriteCitiesSubject.value;
          this.favoriteCitiesSubject.next([...currentCities, newCity]);
          return newCity;
        }),
        catchError(error => {
          console.error('Error adding city:', error);
          return throwError(() => new Error('Failed to add city'));
        })
      );
  }

  // Remove a city from favorites
  removeCity(id: string): Observable<void> {
    return this.http.delete<void>(`${this.firebaseUrl}/${id}.json`)
      .pipe(
        map(() => {
          const currentCities = this.favoriteCitiesSubject.value;
          const updatedCities = currentCities.filter(city => city.id !== id);
          this.favoriteCitiesSubject.next(updatedCities);
        }),
        catchError(error => {
          console.error('Error removing city:', error);
          return throwError(() => new Error('Failed to remove city'));
        })
      );
  }
}
```

### User Workflow for Favorite Cities

1. **Loading Favorites**: When the application starts, `loadFavoriteCities()` retrieves all saved cities from Firebase.

2. **Adding a City**:
   - User enters a city name in the input field
   - `addFavoriteCity()` method is called when user presses Enter or clicks the Add button
   - The service sends a POST request to Firebase with the city name
   - On success, the city is added to the local list and displayed immediately

3. **Removing a City**:
   - User clicks the remove button next to a city
   - `removeFavoriteCity()` method is called with the city's ID
   - The service sends a DELETE request to Firebase
   - On success, the city is removed from the local list and UI updates immediately

4. **Selecting a City**:
   - User clicks on a city name in the favorites list
   - `selectCity()` method is called with the city name
   - The application loads weather data for the selected city

## Services Implementation

### Weather Service

The `WeatherServicesService` handles all interactions with the Tomorrow.io API:

```typescript
@Injectable({
  providedIn: 'root'
})
export class WeatherServicesService {
  private apiKey = 'your-api-key'; // Stored securely in environment file
  private baseUrl = 'https://api.tomorrow.io/v4';

  constructor(private http: HttpClient) {}

  // Get current weather for a location
  getCurrentWeather(city: string): Observable<any> {
    const url = `${this.baseUrl}/weather/realtime`;
    const params = new HttpParams()
      .set('location', city)
      .set('apikey', this.apiKey)
      .set('units', 'metric');

    return this.http.get(url, { params }).pipe(
      map((response: any) => response.data),
      catchError(this.handleError)
    );
  }

  // Get hourly forecast for a location
  getHourlyForecast(city: string): Observable<any[]> {
    const url = `${this.baseUrl}/weather/forecast`;
    const params = new HttpParams()
      .set('location', city)
      .set('apikey', this.apiKey)
      .set('units', 'metric')
      .set('timesteps', '1h')
      .set('startTime', 'now')
      .set('endTime', this.getEndTime(24)); // Next 24 hours

    return this.http.get(url, { params }).pipe(
      map((response: any) => response.data.timelines[0].intervals),
      catchError(this.handleError)
    );
  }

  // Get daily forecast for a location
  getDailyForecast(city: string): Observable<any[]> {
    const url = `${this.baseUrl}/weather/forecast`;
    const params = new HttpParams()
      .set('location', city)
      .set('apikey', this.apiKey)
      .set('units', 'metric')
      .set('timesteps', '1d')
      .set('startTime', 'now')
      .set('endTime', this.getEndTime(7)); // Next 7 days

    return this.http.get(url, { params }).pipe(
      map((response: any) => response.data.timelines[0].intervals),
      catchError(this.handleError)
    );
  }

  // Helper function to calculate end time
  private getEndTime(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  // Error handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => new Error('Failed to fetch weather data. Please try again.'));
  }
}
```

## Responsive Design

The application implements a fully responsive design using CSS Grid, Flexbox, and media queries, ensuring optimal display across various device sizes:

```css
/* Base layout using CSS Grid */
.weather-container {
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 20px;
  padding: 20px;
}

/* Responsive grid for larger screens */
@media (min-width: 768px) {
  .weather-container {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .current-weather-container {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1024px) {
  .weather-container {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .current-weather-container {
    grid-column: 1 / 3;
  }
  
  .hourly-forecast-container {
    grid-column: 1 / -1;
  }
}
```

## Future Enhancements

Based on the current implementation, several enhancements are planned:

1. **Data Export Functionality**: Allow users to export weather data in human-readable formats (PDF, CSV) rather than raw JSON.

2. **Advanced Analytics**: Implement sophisticated data analysis tools to provide insights on weather patterns and trends.

3. **User Authentication**: Add user authentication to personalize the experience and secure user data.

4. **Offline Support**: Implement service workers for offline access to previously loaded weather data.

5. **Location Auto-complete**: Enhance the search functionality with auto-complete suggestions for city names.

---

*Technical Report prepared on March 30, 2025*
