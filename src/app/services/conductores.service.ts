import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConductoresService {

  constructor(private api: ApiService) { }

  // HU-006: Obtener todas las programaciones (el conductor filtra las suyas en el componente)
  getProgramaciones(): Observable<any[]> {
    return this.api.get<any[]>('programaciones');
  }

  // Iniciar turno: cambia el estado de la programación a 'en_curso'
  iniciarTurno(programacionId: string): Observable<any> {
    return this.api.put<any>(`programaciones/${programacionId}`, { estado: 'en_curso' });
  }

  // Finalizar turno: cambia el estado a 'finalizada'
  finalizarTurno(programacionId: string): Observable<any> {
    return this.api.put<any>(`programaciones/${programacionId}`, { estado: 'finalizada' });
  }

  // Obtener turnos activos del conductor (filtramos localmente)
  getTurnos(): Observable<any[]> {
    return this.api.get<any[]>('turnos');
  }

  // Obtener conductor por userId de seguridad
  getConductores(): Observable<any[]> {
    return this.api.get<any[]>('conductores');
  }
}
