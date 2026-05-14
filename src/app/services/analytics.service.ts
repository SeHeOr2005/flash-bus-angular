import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(private api: ApiService) { }

  // HU-014: Analytics - Ingresos por método de pago
  getIngresosAnalytics(): Observable<any> {
    return this.api.get<any>('analytics/ingresos-metodo-pago');
  }

  // HU-015: Analytics - Distribución por edades
  getEdadesAnalytics(): Observable<any> {
    return this.api.get<any>('analytics/pasajeros-edades');
  }

  // HU-016: Analytics - Tendencia de incidentes
  getIncidentesAnalytics(): Observable<any> {
    return this.api.get<any>('analytics/incidentes-tendencia');
  }
}
