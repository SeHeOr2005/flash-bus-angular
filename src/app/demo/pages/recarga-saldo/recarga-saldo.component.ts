import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PagosService } from 'src/app/services/pagos.service';

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

  constructor(private pagosService: PagosService) {}

  ngOnInit(): void {}

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
    if (!this.montoValido) return;

    // Se genera una referencia única simulada
    const invoice = 'REC-' + new Date().getTime();

    const data = {
      description: 'Recarga tarjeta transporte #' + invoice,
      invoice: invoice,
      amount: this.montoAPagar,
      userId: '609b55555555555555555555', // Ciudadano mock
      tarjetaId: 'TARJ-987654',
      userName: 'Juan Pérez'
    };

    this.pagosService.openCheckout(data);
  }
}
