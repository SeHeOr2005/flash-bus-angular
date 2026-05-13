import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConductoresService {

  constructor(private api: ApiService) { }

  // HU-006: Inicio de turno
  iniciarTurno(conductorId: string, programacionId: string): Observable<any> {
    // Aquí el conductor se asocia a la programación del bus
    return this.api.put(`programaciones/${programacionId}/inicio-turno`, { conductor_id: conductorId });
  }

  // Finalizar turno
  finalizarTurno(programacionId: string): Observable<any> {
    return this.api.put(`programaciones/${programacionId}/fin-turno`, {});
  }

  // Obtener programaciones asignadas al conductor
  getProgramacionesConductor(conductorId: string): Observable<any[]> {
    return this.api.get<any[]>(`programaciones/conductor/${conductorId}`);
  }

  // Obtener programación activa actual (para el turno en curso)
  getTurnoActivo(conductorId: string): Observable<any> {
    return this.api.get<any>(`programaciones/conductor/${conductorId}/activo`);
  }
}
