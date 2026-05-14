import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ViajesService {

  constructor(private api: ApiService) { }

  // HU-001
  getRutas(): Observable<any[]> {
    return this.api.get<any[]>('rutas');
  }

  getRutaById(id: string): Observable<any> {
    return this.api.get<any>(`rutas/${id}`);
  }

  getNodosRuta(rutaId: string): Observable<any[]> {
    return this.api.get<any[]>(`rutas/${rutaId}/nodos`);
  }

  getParaderosRuta(rutaId: string): Observable<any[]> {
    return this.api.get<any[]>(`rutas/${rutaId}/paraderos`);
  }

  // HU-002
  getParaderosCercanos(lat: number, lng: number): Observable<any[]> {
    return this.api.get<any[]>('paraderos/cercanos', { lat, lng });
  }

  // --- Gestión (HU-009 a HU-012) ---

  // Rutas (HU-009)
  crearRuta(data: any): Observable<any> {
    return this.api.post('rutas', data);
  }

  actualizarRuta(id: string, data: any): Observable<any> {
    return this.api.put(`rutas/${id}`, data);
  }

  eliminarRuta(id: string): Observable<any> {
    return this.api.delete(`rutas/${id}`);
  }

  // Paraderos (HU-010)
  crearParadero(data: any): Observable<any> {
    return this.api.post('paraderos', data);
  }

  getParaderos(): Observable<any[]> {
    return this.api.get<any[]>('paraderos');
  }

  actualizarParadero(id: string, data: any): Observable<any> {
    return this.api.put(`paraderos/${id}`, data);
  }

  eliminarParadero(id: string): Observable<any> {
    return this.api.delete(`paraderos/${id}`);
  }

  // Programación (HU-011)
  getProgramaciones(): Observable<any[]> {
    return this.api.get<any[]>('programaciones');
  }

  crearProgramacion(data: any): Observable<any> {
    return this.api.post('programaciones', data);
  }

  actualizarProgramacion(id: string, data: any): Observable<any> {
    return this.api.put(`programaciones/${id}`, data);
  }

  eliminarProgramacion(id: string): Observable<any> {
    return this.api.delete(`programaciones/${id}`);
  }

  // Buses (HU-012)
  getBuses(): Observable<any[]> {
    return this.api.get<any[]>('buses');
  }

  crearBus(data: any): Observable<any> {
    return this.api.post('buses', data);
  }

  actualizarBus(id: string, data: any): Observable<any> {
    return this.api.put(`buses/${id}`, data);
  }

  eliminarBus(id: string): Observable<any> {
    return this.api.delete(`buses/${id}`);
  }
}
