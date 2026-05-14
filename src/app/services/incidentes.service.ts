import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IncidentesService {

  constructor(private api: ApiService) { }

  // HU-007: Reporte de incidente - campos que acepta el modelo backend
  reportarIncidente(tipo: string, descripcion: string, reportado_por?: string): Observable<any> {
    const body: any = { tipo, descripcion };
    if (reportado_por) body.reportado_por = reportado_por;
    return this.api.post<any>('incidentes', body);
  }

  // HU-008: Consulta de todos los incidentes
  getIncidentes(): Observable<any[]> {
    return this.api.get<any[]>('incidentes');
  }

  // Obtener todos los incidentes asociados a buses
  getAllIncidentesBus(): Observable<any[]> {
    return this.api.get<any[]>('incidentes-bus');
  }

  // Obtener incidentes de un bus específico vía incidente-bus
  getIncidentesBus(busId: string): Observable<any[]> {
    return this.api.get<any[]>(`incidentes-bus/bus/${busId}`);
  }

  // Reportar incidente asociado a un bus
  reportarIncidenteBus(busId: string, incidenteId: string, descripcion: string): Observable<any> {
    return this.api.post<any>('incidentes-bus', { bus_id: busId, incidente_id: incidenteId, descripcion });
  }

  // Reportar incidente asociado a un bus con severidad
  reportarIncidenteBusSeveridad(busId: string, incidenteId: string, descripcion: string, severidad: string): Observable<any> {
    return this.api.post<any>('incidentes-bus', { bus_id: busId, incidente_id: incidenteId, descripcion, severidad });
  }
}

