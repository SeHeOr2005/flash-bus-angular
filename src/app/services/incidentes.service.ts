import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IncidentesService {

  constructor(private api: ApiService) { }

  // HU-007: Reporte de incidente
  reportarIncidente(programacionId: string, descripcion: string, tipo: string): Observable<any> {
    return this.api.post<any>('incidentes', {
      programacion_id: programacionId,
      descripcion,
      tipo,
      fecha_reporte: new Date()
    });
  }

  // HU-008: Consulta de incidentes por bus (o programación)
  getIncidentes(filtros: any = {}): Observable<any[]> {
    // Si backend soporta query params:
    let queryParams = '?';
    if (filtros.bus_id) queryParams += `bus_id=${filtros.bus_id}&`;
    if (filtros.fecha) queryParams += `fecha=${filtros.fecha}&`;
    if (filtros.programacion_id) queryParams += `programacion_id=${filtros.programacion_id}`;

    return this.api.get<any[]>(`incidentes${queryParams}`);
  }
}
