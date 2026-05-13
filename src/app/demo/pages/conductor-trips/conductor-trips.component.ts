import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConductoresService } from 'src/app/services/conductores.service';
import { IncidentesService } from 'src/app/services/incidentes.service';

@Component({
  selector: 'app-conductor-trips',
  standalone: true,
  imports: [CommonModule, SharedModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './conductor-trips.component.html',
  styleUrls: ['./conductor-trips.component.scss']
})
export default class ConductorTripsComponent implements OnInit {
  // Mock Conductor
  conductorId = '609b55555555555555555556';
  
  turnoActivo: any = null;
  misProgramaciones: any[] = [];
  cargando = false;

  // Formulario Incidente (HU-007)
  mostrandoFormIncidente = false;
  nuevoIncidente = {
    tipo: '',
    descripcion: ''
  };

  tiposIncidente = ['Mecánico', 'Accidente', 'Tráfico', 'Pasajero', 'Otro'];

  constructor(
    private conductoresService: ConductoresService,
    private incidentesService: IncidentesService
  ) {}

  ngOnInit(): void {
    this.cargarTurnoActivo();
  }

  cargarTurnoActivo() {
    this.cargando = true;
    this.conductoresService.getTurnoActivo(this.conductorId).subscribe({
      next: (turno) => {
        this.turnoActivo = turno;
        if (!turno) {
          this.cargarProgramaciones();
        } else {
          this.cargando = false;
        }
      },
      error: () => {
        this.cargarProgramaciones();
      }
    });
  }

  cargarProgramaciones() {
    this.conductoresService.getProgramacionesConductor(this.conductorId).subscribe({
      next: (progs) => {
        this.misProgramaciones = progs.filter(p => !p.conductor_id || p.conductor_id === this.conductorId);
        this.cargando = false;
      },
      error: (err) => {
        // Mock en caso de error
        this.misProgramaciones = [
          {
            _id: '1',
            ruta_id: { nombre: 'Centro - Enea' },
            bus_id: { placa: 'WEO-123' },
            fecha: new Date().toISOString()
          }
        ];
        this.cargando = false;
      }
    });
  }

  // HU-006: Iniciar turno
  iniciarTurno(progId: string) {
    this.cargando = true;
    this.conductoresService.iniciarTurno(this.conductorId, progId).subscribe({
      next: () => {
        alert('Turno iniciado correctamente.');
        this.cargarTurnoActivo();
      },
      error: (err) => {
        // Fallback simulado
        this.turnoActivo = this.misProgramaciones.find(p => p._id === progId);
        this.cargando = false;
        alert('Turno iniciado (Simulado).');
      }
    });
  }

  finalizarTurno() {
    if (!this.turnoActivo) return;
    this.cargando = true;
    this.conductoresService.finalizarTurno(this.turnoActivo._id).subscribe({
      next: () => {
        alert('Turno finalizado.');
        this.turnoActivo = null;
        this.cargarProgramaciones();
      },
      error: () => {
        // Fallback
        this.turnoActivo = null;
        this.cargarProgramaciones();
      }
    });
  }

  // HU-007: Reporte de incidente
  abrirReporteIncidente() {
    this.mostrandoFormIncidente = true;
    this.nuevoIncidente = { tipo: '', descripcion: '' };
  }

  cancelarReporte() {
    this.mostrandoFormIncidente = false;
  }

  enviarReporte() {
    if (!this.nuevoIncidente.tipo || !this.nuevoIncidente.descripcion) {
      alert('Por favor completa todos los campos del incidente.');
      return;
    }
    
    this.cargando = true;
    this.incidentesService.reportarIncidente(this.turnoActivo._id, this.nuevoIncidente.descripcion, this.nuevoIncidente.tipo).subscribe({
      next: () => {
        alert('Incidente reportado exitosamente. La central ha sido notificada.');
        this.mostrandoFormIncidente = false;
        this.cargando = false;
      },
      error: (err) => {
        alert('Incidente reportado exitosamente (Simulado).');
        this.mostrandoFormIncidente = false;
        this.cargando = false;
      }
    });
  }
}
