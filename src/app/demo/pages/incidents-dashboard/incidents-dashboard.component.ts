import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { IncidentesService } from 'src/app/services/incidentes.service';

@Component({
  selector: 'app-incidents-dashboard',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './incidents-dashboard.component.html',
  styleUrls: ['./incidents-dashboard.component.scss']
})
export default class IncidentsDashboardComponent implements OnInit {
  incidentes: any[] = [];
  cargando = true;

  constructor(private incidentesService: IncidentesService) {}

  ngOnInit(): void {
    this.cargarIncidentes();
  }

  cargarIncidentes() {
    this.cargando = true;
    this.incidentesService.getIncidentes().subscribe({
      next: (data) => {
        this.incidentes = data;
        this.cargando = false;
      },
      error: () => {
        // Mock data fallback
        this.incidentes = [
          {
            _id: '1',
            tipo: 'Mecánico',
            descripcion: 'Llanta pinchada en la Av. Santander.',
            fecha_reporte: new Date().toISOString(),
            programacion_id: {
              bus_id: { placa: 'WEO-123' },
              ruta_id: { nombre: 'Centro - Enea' }
            }
          },
          {
            _id: '2',
            tipo: 'Tráfico',
            descripcion: 'Trancón fuerte por accidente de terceros, retraso de 20 min.',
            fecha_reporte: new Date(Date.now() - 86400000).toISOString(),
            programacion_id: {
              bus_id: { placa: 'KOL-987' },
              ruta_id: { nombre: 'Maltería - Centro' }
            }
          }
        ];
        this.cargando = false;
      }
    });
  }

  getBadgeColor(tipo: string): string {
    switch (tipo) {
      case 'Mecánico': return 'bg-danger';
      case 'Tráfico': return 'bg-warning text-dark';
      case 'Accidente': return 'bg-danger';
      case 'Pasajero': return 'bg-info text-dark';
      default: return 'bg-secondary';
    }
  }
}
