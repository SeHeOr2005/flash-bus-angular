import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ViajesService } from 'src/app/services/viajes.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.scss']
})
export default class ManagementComponent implements OnInit {
  // Datos
  rutas: any[] = [];
  paraderos: any[] = [];
  buses: any[] = [];
  programaciones: any[] = [];

  // Formularios
  nuevaRuta = { nombre: '', descripcion: '', distancia_km: 0, duracion_estimada: 0 };
  nuevoParadero = { nombre: '', latitud: 0, longitud: 0 };
  nuevoBus = { placa: '', modelo: '', capacidad: 0, capacidad_sentados: 0, capacidad_parados: 0, empresa_id: '609b55555555555555555555' }; // Mock de empresa
  nuevaProgramacion = { ruta_id: '', bus_id: '', fecha: '', hora_inicio: '', hora_fin: '' };

  // Estado de edición
  editRutaId: string | null = null;
  editParaderoId: string | null = null;
  editBusId: string | null = null;
  editProgramacionId: string | null = null;

  cargando = false;
  activeSection: string = 'buses';

  constructor(private viajesService: ViajesService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.cargarDatos();
    this.route.paramMap.subscribe(params => {
      const section = params.get('section');
      if (section) {
        this.activeSection = section;
      }
    });
  }

  cargarDatos() {
    this.cargando = true;
    // Carga paralela simplificada
    this.viajesService.getRutas().subscribe(res => this.rutas = res);
    this.viajesService.getParaderos().subscribe(res => this.paraderos = res);
    this.viajesService.getBuses().subscribe(res => this.buses = res);
    this.viajesService.getProgramaciones().subscribe(res => {
      this.programaciones = res;
      this.cargando = false;
    });
  }

  // HU-009
  guardarRuta() {
    if (!this.nuevaRuta.nombre) { alert('El nombre es requerido'); return; }
    
    if (this.editRutaId) {
      this.viajesService.actualizarRuta(this.editRutaId, this.nuevaRuta).subscribe({
        next: () => {
          alert('✅ Ruta actualizada exitosamente');
          this.cancelarEdicionRuta();
          this.cargarDatos();
        },
        error: (err) => alert('Error: ' + (err.error?.error || err.message))
      });
    } else {
      this.viajesService.crearRuta(this.nuevaRuta).subscribe({
        next: () => {
          alert('✅ Ruta creada exitosamente');
          this.cancelarEdicionRuta();
          this.cargarDatos();
        },
        error: (err) => alert('Error: ' + (err.error?.error || err.message))
      });
    }
  }

  editarRuta(ruta: any) {
    this.editRutaId = ruta._id;
    this.nuevaRuta = { ...ruta };
  }

  cancelarEdicionRuta() {
    this.editRutaId = null;
    this.nuevaRuta = { nombre: '', descripcion: '', distancia_km: 0, duracion_estimada: 0 };
  }

  eliminarRuta(id: string) {
    if (confirm('¿Estás seguro de eliminar esta ruta?')) {
      this.viajesService.eliminarRuta(id).subscribe({
        next: () => { alert('Ruta eliminada'); this.cargarDatos(); },
        error: (err) => alert('Error eliminando ruta: ' + (err.error?.error || err.message))
      });
    }
  }

  // HU-010
  guardarParadero() {
    if (!this.nuevoParadero.nombre) { alert('El nombre es requerido'); return; }

    if (this.editParaderoId) {
      this.viajesService.actualizarParadero(this.editParaderoId, this.nuevoParadero).subscribe({
        next: () => {
          alert('✅ Paradero actualizado exitosamente');
          this.cancelarEdicionParadero();
          this.cargarDatos();
        },
        error: (err) => alert('Error: ' + (err.error?.error || err.message))
      });
    } else {
      this.viajesService.crearParadero(this.nuevoParadero).subscribe({
        next: () => {
          alert('✅ Paradero registrado exitosamente');
          this.cancelarEdicionParadero();
          this.cargarDatos();
        },
        error: (err) => alert('Error: ' + (err.error?.error || err.message))
      });
    }
  }

  editarParadero(paradero: any) {
    this.editParaderoId = paradero._id;
    this.nuevoParadero = { ...paradero };
  }

  cancelarEdicionParadero() {
    this.editParaderoId = null;
    this.nuevoParadero = { nombre: '', latitud: 0, longitud: 0 };
  }

  eliminarParadero(id: string) {
    if (confirm('¿Estás seguro de eliminar este paradero?')) {
      this.viajesService.eliminarParadero(id).subscribe({
        next: () => { alert('Paradero eliminado'); this.cargarDatos(); },
        error: (err) => alert('Error eliminando paradero: ' + (err.error?.error || err.message))
      });
    }
  }

  // HU-012
  guardarBus() {
    if (!this.nuevoBus.placa) { alert('La placa es requerida'); return; }
    this.nuevoBus.capacidad = this.nuevoBus.capacidad_sentados + this.nuevoBus.capacidad_parados;
    if (this.nuevoBus.capacidad <= 0) { alert('La capacidad debe ser mayor a 0'); return; }

    if (this.editBusId) {
      this.viajesService.actualizarBus(this.editBusId, this.nuevoBus).subscribe({
        next: () => {
          alert('✅ Bus actualizado exitosamente');
          this.cancelarEdicionBus();
          this.cargarDatos();
        },
        error: (err) => alert('Error: ' + (err.error?.error || err.message))
      });
    } else {
      this.viajesService.crearBus(this.nuevoBus).subscribe({
        next: () => {
          alert('✅ Bus registrado exitosamente');
          this.cancelarEdicionBus();
          this.cargarDatos();
        },
        error: (err) => alert('Error: ' + (err.error?.error || err.message))
      });
    }
  }

  editarBus(bus: any) {
    this.editBusId = bus._id;
    this.nuevoBus = { ...bus };
  }

  cancelarEdicionBus() {
    this.editBusId = null;
    this.nuevoBus = { placa: '', modelo: '', capacidad: 0, capacidad_sentados: 0, capacidad_parados: 0, empresa_id: '609b55555555555555555555' };
  }

  eliminarBus(id: string) {
    if (confirm('¿Estás seguro de eliminar este bus?')) {
      this.viajesService.eliminarBus(id).subscribe({
        next: () => { alert('Bus eliminado'); this.cargarDatos(); },
        error: (err) => alert('Error eliminando bus: ' + (err.error?.error || err.message))
      });
    }
  }

  // HU-011
  guardarProgramacion() {
    if (!this.nuevaProgramacion.ruta_id || !this.nuevaProgramacion.bus_id || !this.nuevaProgramacion.fecha
        || !this.nuevaProgramacion.hora_inicio || !this.nuevaProgramacion.hora_fin) {
      alert('Todos los campos de la programación son requeridos');
      return;
    }

    if (this.editProgramacionId) {
      this.viajesService.actualizarProgramacion(this.editProgramacionId, this.nuevaProgramacion).subscribe({
        next: () => {
          alert('✅ Programación actualizada exitosamente');
          this.cancelarEdicionProgramacion();
          this.cargarDatos();
        },
        error: (err) => alert('Error: ' + (err.error?.error || err.message))
      });
    } else {
      this.viajesService.crearProgramacion(this.nuevaProgramacion).subscribe({
        next: () => {
          alert('✅ Programación creada exitosamente');
          this.cancelarEdicionProgramacion();
          this.cargarDatos();
        },
        error: (err) => alert('Error: ' + (err.error?.error || err.message))
      });
    }
  }

  editarProgramacion(prog: any) {
    this.editProgramacionId = prog._id;
    // Si prog.ruta_id es un objeto, extraemos el _id. Si es un string, lo dejamos.
    const rutaId = typeof prog.ruta_id === 'object' && prog.ruta_id !== null ? prog.ruta_id._id : prog.ruta_id;
    const busId = typeof prog.bus_id === 'object' && prog.bus_id !== null ? prog.bus_id._id : prog.bus_id;

    // Convertir fecha de ISO a formato input date (YYYY-MM-DD)
    const fechaFormat = prog.fecha ? new Date(prog.fecha).toISOString().split('T')[0] : '';
    
    this.nuevaProgramacion = { 
      ruta_id: rutaId, 
      bus_id: busId, 
      fecha: fechaFormat, 
      hora_inicio: prog.hora_inicio, 
      hora_fin: prog.hora_fin 
    };
  }

  cancelarEdicionProgramacion() {
    this.editProgramacionId = null;
    this.nuevaProgramacion = { ruta_id: '', bus_id: '', fecha: '', hora_inicio: '', hora_fin: '' };
  }

  eliminarProgramacion(id: string) {
    if (confirm('¿Estás seguro de eliminar esta programación?')) {
      this.viajesService.eliminarProgramacion(id).subscribe({
        next: () => { alert('Programación eliminada'); this.cargarDatos(); },
        error: (err) => alert('Error eliminando programación: ' + (err.error?.error || err.message))
      });
    }
  }
}
