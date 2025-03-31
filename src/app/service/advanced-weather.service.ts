import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of, BehaviorSubject } from 'rxjs';
import { WeatherData, TomorrowApiResponse, WEATHER_CODES, WEATHER_ICONS } from '../models/current-weather';
import { ForecastResponse, DailyForecast, HourlyForecast } from '../models/forecast';
import { environment } from '../../environments/environment.local';
import { WeatherServicesService } from './weather-services.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class AdvancedWeatherService {
  private apiKey = environment.tomorrowIoApiKey;
  private forecastUrl = 'https://api.tomorrow.io/v4/weather/forecast';
  
  // Store the complete API response for advanced analytics
  private rawForecastData: ForecastResponse | null = null;
  
  constructor(
    private http: HttpClient,
    private weatherService: WeatherServicesService
  ) {}
  
  /**
   * Get complete forecast data with all available fields
   */
  getCompleteForecastData(city: string): Observable<ForecastResponse | null> {
    const headers = new HttpHeaders().set('apikey', this.apiKey);
    const params = new HttpParams()
      .set('location', city)
      .set('units', 'metric')
      .set('timesteps', 'hourly,daily')
      .set('fields', 'temperature,temperatureApparent,temperatureMin,temperatureMax,windSpeed,windDirection,humidity,pressureSeaLevel,precipitationProbability,precipitationIntensity,dewPoint,uvIndex,visibility,cloudCover,weatherCode');

    return this.http.get<ForecastResponse>(this.forecastUrl, { headers, params }).pipe(
      map(response => {
        this.rawForecastData = response; // Store the raw data for later use
        return response;
      }),
      catchError(error => {
        console.error('Error fetching complete forecast data:', error);
        return of(null);
      })
    );
  }
  
  /**
   * Generate weather insights based on forecast data
   */
  generateWeatherInsights(hourlyForecast: HourlyForecast[], dailyForecast: DailyForecast[]): any[] {
    const insights: any[] = [];
    
    if (hourlyForecast.length > 0 && dailyForecast.length > 0) {
      // Temperature trend insights
      const tempTrend = this.analyzeTempTrend(hourlyForecast);
      insights.push({
        type: 'temperature',
        title: tempTrend.title,
        description: tempTrend.description,
        icon: '🌡️',
        priority: tempTrend.priority
      });
      
      // Precipitation insights
      const precipInsight = this.analyzePrecipitation(hourlyForecast);
      if (precipInsight) {
        insights.push({
          type: 'precipitation',
          title: precipInsight.title,
          description: precipInsight.description,
          icon: '🌧️',
          priority: precipInsight.priority
        });
      }
      
      // Wind insights
      const windInsight = this.analyzeWind(hourlyForecast);
      if (windInsight) {
        insights.push({
          type: 'wind',
          title: windInsight.title,
          description: windInsight.description,
          icon: '💨',
          priority: windInsight.priority
        });
      }
      
      // UV index insights
      const uvInsight = this.analyzeUVIndex(hourlyForecast);
      if (uvInsight) {
        insights.push({
          type: 'uv',
          title: uvInsight.title,
          description: uvInsight.description,
          icon: '☀️',
          priority: uvInsight.priority
        });
      }
      
      // Weather pattern insights
      const patternInsight = this.analyzeWeatherPattern(dailyForecast);
      insights.push({
        type: 'pattern',
        title: patternInsight.title,
        description: patternInsight.description,
        icon: patternInsight.icon,
        priority: patternInsight.priority
      });
    }
    
    // Sort insights by priority (higher number = higher priority)
    return insights.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Analyze temperature trends in hourly forecast
   */
  private analyzeTempTrend(hourlyForecast: HourlyForecast[]): {title: string, description: string, priority: number} {
    const temps = hourlyForecast.slice(0, 24).map(h => h.temperature);
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const tempDiff = maxTemp - minTemp;
    const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
    
    let title = '';
    let description = '';
    let priority = 3;
    
    if (tempDiff > 10) {
      title = 'Large Temperature Fluctuations Expected';
      description = `Temperature will vary significantly by ${tempDiff.toFixed(1)}°C over the next 24 hours. Prepare for both ${minTemp.toFixed(1)}°C and ${maxTemp.toFixed(1)}°C.`;
      priority = 5;
    } else if (maxTemp > 30) {
      title = 'High Temperatures Expected';
      description = `Temperatures will reach up to ${maxTemp.toFixed(1)}°C. Stay hydrated and avoid prolonged sun exposure.`;
      priority = 4;
    } else if (minTemp < 10) {
      title = 'Cool Temperatures Expected';
      description = `Temperatures will drop to ${minTemp.toFixed(1)}°C. Consider wearing layers.`;
      priority = 4;
    } else {
      title = 'Moderate Temperature Expected';
      description = `Expect average temperatures around ${avgTemp.toFixed(1)}°C with a range of ${minTemp.toFixed(1)}°C to ${maxTemp.toFixed(1)}°C.`;
      priority = 2;
    }
    
    return { title, description, priority };
  }
  
  /**
   * Analyze precipitation in hourly forecast
   */
  private analyzePrecipitation(hourlyForecast: HourlyForecast[]): {title: string, description: string, priority: number} | null {
    const precipProbs = hourlyForecast.slice(0, 24).map(h => h.precipitation);
    const maxPrecip = Math.max(...precipProbs);
    
    if (maxPrecip < 20) {
      return null; // No significant precipitation expected
    }
    
    const highPrecipHours = precipProbs.filter(p => p > 50).length;
    let title = '';
    let description = '';
    let priority = 3;
    
    if (highPrecipHours > 6) {
      title = 'Extended Precipitation Expected';
      description = `High chance of precipitation (>50%) for ${highPrecipHours} hours in the next 24 hours. Consider indoor activities.`;
      priority = 5;
    } else if (maxPrecip > 70) {
      title = 'Heavy Precipitation Possible';
      description = `There's a ${maxPrecip}% chance of precipitation at its peak. Be prepared for potential heavy rain.`;
      priority = 4;
    } else {
      title = 'Some Precipitation Expected';
      description = `There's a ${maxPrecip}% chance of precipitation at its peak.`;
      priority = 3;
    }
    
    return { title, description, priority };
  }
  
  /**
   * Analyze wind conditions in hourly forecast
   */
  private analyzeWind(hourlyForecast: HourlyForecast[]): {title: string, description: string, priority: number} | null {
    const windSpeeds = hourlyForecast.slice(0, 24).map(h => h.windSpeed);
    const maxWind = Math.max(...windSpeeds);
    
    if (maxWind < 15) {
      return null; // No significant wind expected
    }
    
    let title = '';
    let description = '';
    let priority = 3;
    
    if (maxWind > 40) {
      title = 'Strong Winds Expected';
      description = `Wind speeds may reach up to ${maxWind.toFixed(1)} km/h. Secure loose outdoor items.`;
      priority = 5;
    } else if (maxWind > 25) {
      title = 'Moderate Winds Expected';
      description = `Wind speeds may reach up to ${maxWind.toFixed(1)} km/h.`;
      priority = 3;
    } else {
      title = 'Breezy Conditions Expected';
      description = `Wind speeds may reach up to ${maxWind.toFixed(1)} km/h.`;
      priority = 2;
    }
    
    return { title, description, priority };
  }
  
  /**
   * Analyze UV index in hourly forecast (if available)
   */
  private analyzeUVIndex(hourlyForecast: HourlyForecast[]): {title: string, description: string, priority: number} | null {
    // This would require adding UV index to the HourlyForecast model
    // For now, we'll return a placeholder
    return {
      title: 'UV Protection Recommended',
      description: 'UV levels may be elevated during midday hours. Consider sun protection.',
      priority: 3
    };
  }
  
  /**
   * Analyze overall weather pattern in daily forecast
   */
  private analyzeWeatherPattern(dailyForecast: DailyForecast[]): {title: string, description: string, icon: string, priority: number} {
    // Count weather types
    const weatherCodes = dailyForecast.slice(0, 5).map(d => d.weatherCode);
    const weatherTypes = new Map<number, number>();
    
    weatherCodes.forEach(code => {
      weatherTypes.set(code, (weatherTypes.get(code) || 0) + 1);
    });
    
    // Find most common weather type
    let mostCommonCode = weatherCodes[0];
    let maxCount = 0;
    
    weatherTypes.forEach((count, code) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonCode = code;
      }
    });
    
    const description = WEATHER_CODES[mostCommonCode as keyof typeof WEATHER_CODES] || 'Mixed weather';
    const icon = WEATHER_ICONS[mostCommonCode as keyof typeof WEATHER_ICONS] || '🌤️';
    
    return {
      title: `${description} Pattern`,
      description: `Expect predominantly ${description.toLowerCase()} conditions over the next few days.`,
      icon,
      priority: 4
    };
  }
  
  /**
   * Calculate daily temperature averages for the week
   */
  calculateDailyAverages(dailyForecast: DailyForecast[]): any[] {
    return dailyForecast.map(day => {
      const date = new Date(day.date);
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        avgTemp: day.temperature,
        minTemp: day.temperatureMin,
        maxTemp: day.temperatureMax,
        precipitation: day.precipitation,
        humidity: day.humidity,
        windSpeed: day.windSpeed,
        description: day.description,
        icon: day.weatherIcon
      };
    });
  }
  
  /**
   * Generate PDF report with weather data
   */
  generateWeatherReport(city: string, currentWeather: WeatherData, hourlyForecast: HourlyForecast[], dailyForecast: DailyForecast[]): Observable<Blob> {
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(0, 51, 102);
      doc.text(`Weather Report: ${city}`, pageWidth / 2, 20, { align: 'center' });
      
      // Add generation date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, 28, { align: 'center' });
      
      // Add current weather section
      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102);
      doc.text('Current Weather', 14, 40);
      
      if (currentWeather) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Temperature: ${currentWeather.temperature}°C`, 14, 50);
        doc.text(`Condition: ${currentWeather.description}`, 14, 58);
        doc.text(`Humidity: ${currentWeather.humidity}%`, 14, 66);
        doc.text(`Wind Speed: ${currentWeather.windSpeed} km/h`, 14, 74);
        doc.text(`Precipitation: ${currentWeather.precipitation}%`, 14, 82);
      }
      
      // Add hourly forecast section
      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102);
      doc.text('Hourly Forecast (Next 8 Hours)', 14, 100);
      
      if (hourlyForecast && hourlyForecast.length > 0) {
        const hourlyData = hourlyForecast.slice(0, 8).map(hour => {
          const time = new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return [
            time,
            `${hour.temperature}°C`,
            `${hour.precipitation}%`,
            `${hour.windSpeed} km/h`,
            hour.description
          ];
        });
        
        autoTable(doc, {
          startY: 110,
          head: [['Time', 'Temp', 'Precip', 'Wind', 'Condition']],
          body: hourlyData,
          theme: 'grid',
          headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [240, 240, 240] }
        });
      }
      
      // Add daily forecast section
      const tableEndY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102);
      doc.text('Daily Forecast (Next 5 Days)', 14, tableEndY);
      
      if (dailyForecast && dailyForecast.length > 0) {
        const dailyData = dailyForecast.slice(0, 5).map(day => {
          const date = new Date(day.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
          return [
            date,
            `${day.temperatureMin}°C - ${day.temperatureMax}°C`,
            `${day.precipitation}%`,
            `${day.windSpeed} km/h`,
            day.description
          ];
        });
        
        autoTable(doc, {
          startY: tableEndY + 10,
          head: [['Date', 'Temp Range', 'Precip', 'Wind', 'Condition']],
          body: dailyData,
          theme: 'grid',
          headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [240, 240, 240] }
        });
      }
      
      // Add insights section
      const insights = this.generateWeatherInsights(hourlyForecast, dailyForecast);
      if (insights.length > 0) {
        const insightsY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFontSize(16);
        doc.setTextColor(0, 51, 102);
        doc.text('Weather Insights', 14, insightsY);
        
        let yPos = insightsY + 10;
        insights.slice(0, 3).forEach(insight => {
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.text(`• ${insight.title}`, 14, yPos);
          
          // Split long descriptions into multiple lines
          const splitDescription = doc.splitTextToSize(insight.description, pageWidth - 28);
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          doc.text(splitDescription, 20, yPos + 6);
          
          yPos += 8 + (splitDescription.length * 5);
        });
      }
      
      // Add footer
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Weather App - Powered by Tomorrow.io', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
      
      // Generate PDF blob
      const pdfBlob = doc.output('blob');
      return of(pdfBlob);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      return of(new Blob(['Error generating report'], { type: 'text/plain' }));
    }
  }
}

/**
 * Interface for weather insights
 */
export interface WeatherInsight {
  type: string;
  title: string;
  description: string;
  icon: string;
  priority: number; // Higher number = higher priority
}
