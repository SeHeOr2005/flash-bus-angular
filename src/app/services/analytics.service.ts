import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(private api: ApiService) { }

  // HU-014: Analytics - Ingresos
  getIngresosAnalytics(): Observable<any> {
    return this.api.get('analytics/ingresos');
  }

  // HU-015: Analytics - Edades
  getEdadesAnalytics(): Observable<any> {
    return this.api.get('analytics/edades');
  }

  // HU-016: Analytics - Incidentes
  getIncidentesAnalytics(): Observable<any> {
    return this.api.get('analytics/incidentes');
  }
}
