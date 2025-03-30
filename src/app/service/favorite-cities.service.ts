import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError, of, tap } from 'rxjs';

export interface FavoriteCity {
  id?: string;
  name: string;
}

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
          
          // Convert Firebase object to array with IDs
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

  // Add a new favorite city
  addCity(cityName: string): Observable<FavoriteCity> {
    const city: FavoriteCity = { name: cityName };
    
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
          return of({ name: cityName });
        })
      );
  }

  // Remove a favorite city
  removeCity(cityId: string): Observable<boolean> {
    return this.http.delete(`${this.firebaseUrl}/${cityId}.json`)
      .pipe(
        map(() => {
          const currentCities = this.favoriteCitiesSubject.value;
          const updatedCities = currentCities.filter(city => city.id !== cityId);
          this.favoriteCitiesSubject.next(updatedCities);
          return true;
        }),
        catchError(error => {
          console.error('Error removing city:', error);
          return of(false);
        })
      );
  }

  // Get current favorite cities
  getFavoriteCities(): FavoriteCity[] {
    return this.favoriteCitiesSubject.value;
  }
}
