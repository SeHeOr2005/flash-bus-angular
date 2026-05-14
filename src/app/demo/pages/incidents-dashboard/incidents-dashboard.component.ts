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
    this.incidentesService.getAllIncidentesBus().subscribe({
      next: (data) => {
        this.incidentes = data.map(ib => ({
          _id: ib._id,
          incidente_id: ib.incidente_id?._id,
          tipo: ib.incidente_id?.tipo || 'Desconocido',
          descripcion: ib.descripcion || ib.incidente_id?.descripcion,
          fecha_reporte: ib.createdAt,
          severidad: ib.severidad,
          estado: ib.incidente_id?.estado || 'reportado',
          bus: ib.bus_id?.placa || 'N/A'
        }));
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
            severidad: 'alta',
            estado: 'reportado',
            bus: 'WEO-123'
          }
        ];
        this.cargando = false;
      }
    });
  }

  cambiarEstado(incidenteId: string, nuevoEstado: string) {
    if (!incidenteId) return;
    
    // Suponemos que tienes un método en incidentesService para actualizar el estado en el backend
    // Por ahora solo actualizamos el estado visualmente
    const inc = this.incidentes.find(i => i.incidente_id === incidenteId);
    if (inc) {
      inc.estado = nuevoEstado;
    }
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

  getSeveridadColor(sev: string): string {
    switch (sev) {
      case 'baja': return 'bg-success';
      case 'media': return 'bg-warning text-dark';
      case 'alta': return 'bg-orange text-white';
      case 'critica': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
}
