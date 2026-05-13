import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BoletosService {

  constructor(private api: ApiService) { }

  // HU-003: Abordaje
  abordar(programacionId: string, ciudadanoId: string, metodoPagoId: string): Observable<any> {
    // Para simplificar, el abordaje crea un boleto con estado 'activo'
    return this.api.post<any>('boletos', {
      programacion_id: programacionId,
      ciudadano_id: ciudadanoId,
      metodo_pago_id: metodoPagoId,
      estado: 'activo'
      // El backend o el controlador debería descontar saldo de la tarjeta, pero aquí creamos el boleto
    });
  }

  // HU-004: Descenso
  descender(boletoId: string): Observable<any> {
    return this.api.put<any>(`boletos/${boletoId}`, {
      estado: 'completado'
    });
  }

  // HU-005: Historial y recorridos
  getBoletosCiudadano(ciudadanoId: string): Observable<any[]> {
    return this.api.get<any[]>(`boletos/ciudadano/${ciudadanoId}`);
  }

  // Para simular el abordaje necesitamos obtener programaciones y métodos de pago
  getProgramaciones(): Observable<any[]> {
    return this.api.get<any[]>('programaciones');
  }

  getMetodosPago(): Observable<any[]> {
    return this.api.get<any[]>('metodos-pago');
  }
}
