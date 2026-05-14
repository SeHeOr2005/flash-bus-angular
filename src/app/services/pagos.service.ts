import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

declare var ePayco: any;

@Injectable({
  providedIn: 'root'
})
export class PagosService {
  private handler: any;

  constructor(private api: ApiService) {
    this.initEpayco();
  }

  getMetodoPagoCiudadano(ciudadanoId: string): Observable<any[]> {
    return this.api.get<any[]>(`metodo-pago-ciudadano/ciudadano/${ciudadanoId}`);
  }

  getMetodosPagoGenerales(): Observable<any[]> {
    return this.api.get<any[]>('metodos-pago');
  }

  vincularMetodoPago(data: { ciudadano_id: string, metodo_pago_id: string, detalle: string }): Observable<any> {
    return this.api.post<any>('metodo-pago-ciudadano', data);
  }

  getCiudadanos(): Observable<any[]> {
    return this.api.get<any[]>('ciudadanos');
  }

  crearCiudadano(data: any): Observable<any> {
    return this.api.post<any>('ciudadanos', data);
  }

  recargarSaldo(id: string, monto: number): Observable<any> {
    return this.api.post<any>(`metodo-pago-ciudadano/${id}/recargar`, { monto });
  }

  private initEpayco() {
    // Inicializar ePayco Checkout
    if (typeof ePayco !== 'undefined') {
      this.handler = ePayco.checkout.configure({
        key: environment.epayco.publicKey,
        test: environment.epayco.testMode
      });
    } else {
      console.error('El script de ePayco no se ha cargado.');
    }
  }

  openCheckout(data: any) {
    if (!this.handler) {
      this.initEpayco();
    }
    
    if (this.handler) {
      this.handler.open({
        // Parámetros de la compra
        name: data.description,
        description: data.description,
        invoice: data.invoice,
        currency: 'cop',
        amount: data.amount,
        tax_base: '0',
        tax: '0',
        country: 'co',
        lang: 'es',

        // Parámetros adicionales
        external: 'false',
        extra1: data.userId, // Útil para nuestro webhook
        extra2: data.tarjetaId,

        // URLs de respuesta
        response: `${window.location.origin}/dashboard`, // A donde redirige tras éxito/fallo
        confirmation: environment.negocioUrl + '/pagos/epayco/webhook', // Webhook del backend (futuro)
        
        // Datos pre-llenados
        name_billing: data.userName || 'Usuario FlashBus',
        type_doc_billing: 'CC',
        number_doc_billing: data.userDoc || '100000000'
      });
    }
  }
}
