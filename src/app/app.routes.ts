import { Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { AdvancedDataPageComponent } from './advanced-data-page/advanced-data-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'advanced', component: AdvancedDataPageComponent }
];
