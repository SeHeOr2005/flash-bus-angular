import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PagosService } from 'src/app/services/pagos.service';
import { AuthService } from 'src/app/@theme/services/auth.service';

@Component({
  selector: 'app-recarga-saldo',
  standalone: true,
  imports: [CommonModule, SharedModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './recarga-saldo.component.html',
  styleUrls: ['./recarga-saldo.component.scss']
})
export default class RecargaSaldoComponent implements OnInit {
  saldoActual = 15500; // Mock de saldo actual
  montoSeleccionado: number | null = null;
  montoPersonalizado: number | null = null;
  
  montosPredefinidos = [10000, 20000, 50000, 100000];

  metodoPagoActivo: any;
  cargando = true;
  errorCarga: string | null = null;

  // Registro de nuevo método
  metodosPagoGenerales: any[] = [];
  nuevoMetodoPagoGeneralId: string = '';
  documentoParaVincular: string = '';
  ciudadanoNegocioId: string | null = null;
  vincularModo = false;

  constructor(
    private pagosService: PagosService, 
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarMetodoPago();
  }

  cargarMetodoPago() {
    this.cargando = true;
    this.errorCarga = null;
    const user = this.authService.getCurrentUser();
    
    if (!user || !user.email) {
      this.cargando = false;
      return;
    }

    // 1. Buscar el ciudadano en ms-negocio por email
    this.pagosService.getCiudadanos().subscribe({
      next: (ciudadanos) => {
        const matching = ciudadanos.find(c => c.email === user.email);
        
        if (matching) {
          this.ciudadanoNegocioId = matching._id;
          this.cargarMetodosDelCiudadano(matching._id);
        } else {
          // No existe en ms-negocio, hay que crearlo antes de vincular
          this.cargando = false;
          this.vincularModo = true; // Forzar modo vinculación para registrarse
          this.cargarMetodosGenerales();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error buscando ciudadano', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarMetodosDelCiudadano(cid: string) {
    this.pagosService.getMetodoPagoCiudadano(cid).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.metodoPagoActivo = data[0];
          this.saldoActual = this.metodoPagoActivo.saldo || 0;
          this.vincularModo = false;
        } else {
          this.vincularModo = true;
          this.cargarMetodosGenerales();
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarMetodosGenerales() {
    this.pagosService.getMetodosPagoGenerales().subscribe(data => {
      this.metodosPagoGenerales = data;
      this.cdr.detectChanges();
    });
  }

  vincularNuevaTarjeta() {
    if (!this.nuevoMetodoPagoGeneralId || !this.documentoParaVincular) {
      alert('Por favor complete todos los datos');
      return;
    }

    this.cargando = true;
    const user = this.authService.getCurrentUser();

    // Si el ciudadano no existe en ms-negocio, lo creamos primero
    if (!this.ciudadanoNegocioId) {
      const parts = (user?.name || 'Usuario Flash').split(' ');
      const payloadCiudadano = {
        nombre: parts[0] || 'Usuario',
        apellido: parts.slice(1).join(' ') || 'Flash',
        documento: this.documentoParaVincular,
        email: user?.email,
        user_id: user?.id
      };

      this.pagosService.crearCiudadano(payloadCiudadano).subscribe({
        next: (nuevoC) => {
          this.ciudadanoNegocioId = nuevoC._id;
          this.finalizarVinculacion(nuevoC._id);
        },
        error: (err) => {
          alert('Error creando perfil de ciudadano: ' + err.message);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.finalizarVinculacion(this.ciudadanoNegocioId);
    }
  }

  private finalizarVinculacion(cid: string) {
    this.pagosService.vincularMetodoPago({
      ciudadano_id: cid,
      metodo_pago_id: this.nuevoMetodoPagoGeneralId,
      detalle: 'Billetera Principal'
    }).subscribe({
      next: () => {
        alert('¡Tarjeta vinculada con éxito!');
        this.cargarMetodoPago();
      },
      error: (err) => {
        alert('Error vinculando tarjeta: ' + err.message);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarMonto(monto: number) {
    this.montoSeleccionado = monto;
    this.montoPersonalizado = null;
  }

  get montoValido(): boolean {
    if (this.montoPersonalizado) {
      return this.montoPersonalizado >= 5000 && this.montoPersonalizado <= 500000;
    }
    return this.montoSeleccionado !== null;
  }

  get montoAPagar(): number {
    return this.montoPersonalizado || this.montoSeleccionado || 0;
  }

  get saldoProyectado(): number {
    return this.saldoActual + this.montoAPagar;
  }

  continuarPago() {
    if (!this.montoValido || !this.metodoPagoActivo) return;

    // Simulación de checkout con ePayco
    if (confirm(`Serás redirigido a ePayco para pagar $${this.montoAPagar}. ¿Deseas SIMULAR un pago exitoso ahora mismo?`)) {
      this.cargando = true;
      this.pagosService.recargarSaldo(this.metodoPagoActivo._id, this.montoAPagar).subscribe({
        next: (res) => {
          alert('✅ Pago exitoso en ePayco simulado. Saldo recargado.');
          this.saldoActual = res.saldo;
          this.montoSeleccionado = null;
          this.montoPersonalizado = null;
          this.cargando = false;
        },
        error: (err) => {
          alert('Error recargando saldo: ' + (err.error?.error || err.message));
          this.cargando = false;
        }
      });
    } else {
      // Flujo original ePayco (requiere credenciales reales)
      const user = this.authService.getCurrentUser();
      const invoice = 'REC-' + new Date().getTime();
      const data = {
        description: 'Recarga tarjeta transporte #' + invoice,
        invoice: invoice,
        amount: this.montoAPagar,
        userId: user?.id || 'unknown',
        tarjetaId: this.metodoPagoActivo._id,
        userName: user?.name || 'Usuario'
      };
      this.pagosService.openCheckout(data);
    }
  }
}
