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
  nuevaRuta = { nombre: '', descripcion: '', tarifa: 0 };
  nuevoParadero = { nombre: '', latitud: 0, longitud: 0 };
  nuevoBus = { placa: '', modelo: '', capacidad: 0 };
  nuevaProgramacion = { ruta_id: '', bus_id: '', fecha: '' };

  cargando = false;

  constructor(private viajesService: ViajesService) {}

  ngOnInit(): void {
    this.cargarDatos();
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
    this.viajesService.crearRuta(this.nuevaRuta).subscribe(() => {
      alert('Ruta creada');
      this.nuevaRuta = { nombre: '', descripcion: '', tarifa: 0 };
      this.cargarDatos();
    });
  }

  // HU-010
  guardarParadero() {
    this.viajesService.crearParadero(this.nuevoParadero).subscribe(() => {
      alert('Paradero creado');
      this.nuevoParadero = { nombre: '', latitud: 0, longitud: 0 };
      this.cargarDatos();
    });
  }

  // HU-012
  guardarBus() {
    this.viajesService.crearBus(this.nuevoBus).subscribe(() => {
      alert('Bus registrado');
      this.nuevoBus = { placa: '', modelo: '', capacidad: 0 };
      this.cargarDatos();
    });
  }

  // HU-011
  guardarProgramacion() {
    this.viajesService.crearProgramacion(this.nuevaProgramacion).subscribe(() => {
      alert('Programación creada');
      this.nuevaProgramacion = { ruta_id: '', bus_id: '', fecha: '' };
      this.cargarDatos();
    });
  }
}
