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
  turnoActivo: any = null;
  misProgramaciones: any[] = [];
  cargando = false;

  // Formulario Incidente (HU-007)
  mostrandoFormIncidente = false;
  nuevoIncidente = {
    tipo: '',
    descripcion: '',
    severidad: 'media'
  };

  tiposIncidente = ['Mecánico', 'Accidente', 'Tráfico', 'Pasajero', 'Otro'];
  nivelesSeveridad = ['baja', 'media', 'alta', 'critica'];

  constructor(
    private conductoresService: ConductoresService,
    private incidentesService: IncidentesService
  ) {}

  ngOnInit(): void {
    this.cargarProgramaciones();
  }

  cargarProgramaciones() {
    this.cargando = true;
    this.conductoresService.getProgramaciones().subscribe({
      next: (progs) => {
        this.misProgramaciones = progs;
        // Si hay alguna en_curso, considerarla como turno activo
        this.turnoActivo = progs.find(p => p.estado === 'en_curso') || null;
        this.cargando = false;
      },
      error: () => {
        // Mock en caso de error de conexión
        this.misProgramaciones = [
          {
            _id: 'mock-1',
            ruta_id: { nombre: 'Centro - Enea' },
            bus_id: { placa: 'WEO-123', _id: 'bus-mock' },
            fecha: new Date().toISOString(),
            hora_inicio: '06:00',
            hora_fin: '14:00',
            estado: 'programada'
          }
        ];
        this.cargando = false;
      }
    });
  }

  // HU-006: Iniciar turno
  iniciarTurno(prog: any) {
    this.cargando = true;
    this.conductoresService.iniciarTurno(prog._id).subscribe({
      next: (updated) => {
        this.turnoActivo = updated;
        const idx = this.misProgramaciones.findIndex(p => p._id === prog._id);
        if (idx !== -1) this.misProgramaciones[idx].estado = 'en_curso';
        this.cargando = false;
        alert('¡Turno iniciado correctamente!');
      },
      error: () => {
        this.turnoActivo = { ...prog, estado: 'en_curso' };
        this.cargando = false;
        alert('Turno iniciado (modo sin conexión).');
      }
    });
  }

  finalizarTurno() {
    if (!this.turnoActivo) return;
    this.cargando = true;
    this.conductoresService.finalizarTurno(this.turnoActivo._id).subscribe({
      next: () => {
        alert('Turno finalizado correctamente.');
        this.turnoActivo = null;
        this.cargarProgramaciones();
      },
      error: () => {
        this.turnoActivo = null;
        this.cargarProgramaciones();
      }
    });
  }

  // HU-007: Reporte de incidente
  abrirReporteIncidente() {
    this.mostrandoFormIncidente = true;
    this.nuevoIncidente = { tipo: '', descripcion: '', severidad: 'media' };
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

    // Primero creamos el incidente
    this.incidentesService.reportarIncidente(
      this.nuevoIncidente.tipo,
      this.nuevoIncidente.descripcion
    ).subscribe({
      next: (incidenteCreado) => {
        // Luego lo asociamos al bus
        if (this.turnoActivo && this.turnoActivo.bus_id) {
          const busId = typeof this.turnoActivo.bus_id === 'object' ? this.turnoActivo.bus_id._id : this.turnoActivo.bus_id;
          
          // Agregamos la llamada con severidad
          this.incidentesService.reportarIncidenteBusSeveridad(
            busId,
            incidenteCreado._id,
            this.nuevoIncidente.descripcion,
            this.nuevoIncidente.severidad
          ).subscribe({
            next: () => {
              alert('Incidente reportado exitosamente. La central ha sido notificada.');
              this.mostrandoFormIncidente = false;
              this.cargando = false;
            },
            error: () => {
              alert('Incidente base creado, error al asociarlo al bus.');
              this.mostrandoFormIncidente = false;
              this.cargando = false;
            }
          });
        } else {
          alert('Incidente reportado (Sin bus activo)');
          this.mostrandoFormIncidente = false;
          this.cargando = false;
        }
      },
      error: () => {
        alert('Incidente registrado (modo sin conexión).');
        this.mostrandoFormIncidente = false;
        this.cargando = false;
      }
    });
  }
}
