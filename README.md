# Weather App in Angular

A modern weather application built with Angular that provides real-time weather data, forecasts, and customizable favorite cities. The app features a responsive design with interactive charts and a clean user interface.

![Weather App Screenshot](screenshot.png)

## Features

- **Current Weather Display**: View current temperature, weather conditions, humidity, wind speed, precipitation, and UV index
- **Hourly Forecast**: Interactive chart displaying temperature, precipitation, or wind data for the next 8 hours
- **Favorite Cities Management**: Add, remove, and select favorite cities with Firebase Realtime Database integration
- **Responsive Design**: Clean, modern UI that works across different device sizes
- **Real-time Data**: Fetches up-to-date weather information from Tomorrow.io API

## Project Architecture

The application follows a centralized data management approach:

- **AppComponent**: Main container component that handles routing
- **HomePageComponent**: Primary view that displays weather information and manages user interactions
- **WeatherServicesService**: Handles API calls to Tomorrow.io for weather data
- **FavoriteCitiesService**: Manages favorite cities with Firebase Realtime Database

## Technologies Used

- **Angular 19**: Framework for building the application
- **Chart.js with ng2-charts**: For interactive weather data visualization
- **Firebase Realtime Database**: For storing and syncing user's favorite cities
- **Tomorrow.io API**: Weather data provider
- **RxJS**: For reactive programming and handling asynchronous operations

## Setup and Installation

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v19 or higher)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/weatherApp_in_Angular.git
   cd weatherApp_in_Angular
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment files:
   Create a file at `src/environments/environment.local.ts` with your API keys:
   ```typescript
   export const environment = {
     production: false,
     tomorrowIoApiKey: 'YOUR_TOMORROW_IO_API_KEY'
   };
   ```

4. Start the development server:
   ```bash
   ng serve
   ```

5. Open your browser and navigate to `http://localhost:4200/`

## Firebase Setup

The app uses Firebase Realtime Database for storing favorite cities. The database URL is already configured in the app, but you may need to set up your own Firebase project for production use:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Set up a Realtime Database
3. Update the database URL in `src/app/service/favorite-cities.service.ts`

## Development

### Code Structure

- `src/app/service/`: Contains services for API communication
- `src/app/models/`: Data models and interfaces
- `src/app/home-page/`: Main component for displaying weather information
- `src/app/advanced-data-page/`: Additional weather data visualization

### Adding New Features

To add new components to the project:

```bash
ng generate component component-name
```

## Building for Production

To create a production build:

```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Tomorrow.io](https://www.tomorrow.io/) for providing the weather data API
- [Chart.js](https://www.chartjs.org/) for the charting library
- [Firebase](https://firebase.google.com/) for the realtime database
