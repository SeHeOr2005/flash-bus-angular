import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

interface Ticket {
  id: string;
  bookingCode: string;
  busCompany: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  date: string;
  passenger: string;
  seat: string;
  status: 'active' | 'completed' | 'cancelled';
  price: number;
  qrCode: string;
}

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, SharedModule, MatButtonModule, MatIconModule, MatTabsModule],
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.scss']
})
export default class TicketComponent {
  activeTickets: Ticket[] = [
    {
      id: '1',
      bookingCode: 'FB123456',
      busCompany: 'Flash Bus Group',
      origin: 'Bogotá',
      destination: 'Medellín',
      departure: '10:00',
      arrival: '16:30',
      date: '15 de Marzo 2026',
      passenger: 'Juan Pérez García',
      seat: '12A',
      status: 'active',
      price: 45000,
      qrCode: 'FB123456'
    }
  ];

  completedTickets: Ticket[] = [
    {
      id: '2',
      bookingCode: 'FB098765',
      busCompany: 'Expreso Moderno',
      origin: 'Medellín',
      destination: 'Cali',
      departure: '08:00',
      arrival: '13:00',
      date: '10 de Marzo 2026',
      passenger: 'Juan Pérez García',
      seat: '8B',
      status: 'completed',
      price: 35000,
      qrCode: 'FB098765'
    },
    {
      id: '3',
      bookingCode: 'FB654321',
      busCompany: 'Travel Express',
      origin: 'Bogotá',
      destination: 'Bucaramanga',
      departure: '14:00',
      arrival: '18:30',
      date: '05 de Marzo 2026',
      passenger: 'Juan Pérez García',
      seat: '5C',
      status: 'completed',
      price: 38000,
      qrCode: 'FB654321'
    }
  ];

  downloadTicket(ticket: Ticket): void {
    alert(`Descargando tarjeta: ${ticket.bookingCode}`);
  }

  shareTicket(ticket: Ticket): void {
    alert(`Compartiendo tarjeta: ${ticket.bookingCode}`);
  }

  cancelTicket(ticket: Ticket): void {
    alert(`Cancelando reserva: ${ticket.bookingCode}`);
  }
}
