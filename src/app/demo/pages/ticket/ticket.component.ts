import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BoletosService } from 'src/app/services/boletos.service';

import * as L from 'leaflet';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, SharedModule, FormsModule, MatButtonModule, MatIconModule, MatTabsModule],
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.scss']
})
export default class TicketComponent implements OnInit, OnDestroy {
  // Para demostración, mockeamos un ciudadano logueado
  ciudadanoId = '609b55555555555555555555'; // Asume un ID válido, o lo sacamos del Auth

  boletosActivos: any[] = [];
  boletosCompletados: any[] = [];
  
  cargando = false;

  // Abordaje
  programaciones: any[] = [];
  metodosPago: any[] = [];
  nuevaProgramacionId: string = '';
  nuevoMetodoPagoId: string = '';

  // Mapa
  map: L.Map | undefined;
  routeLayer: L.FeatureGroup | undefined;
  viajeSeleccionado: any = null;

  constructor(private boletosService: BoletosService) {}

  ngOnInit(): void {
    this.cargarDatosFormulario();
    this.cargarBoletos();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  cargarDatosFormulario() {
    this.boletosService.getProgramaciones().subscribe(data => this.programaciones = data);
    this.boletosService.getMetodosPago().subscribe(data => this.metodosPago = data);
  }

  cargarBoletos() {
    this.cargando = true;
    this.boletosService.getBoletosCiudadano(this.ciudadanoId).subscribe({
      next: (data) => {
        this.boletosActivos = data.filter(b => b.estado === 'activo');
        this.boletosCompletados = data.filter(b => b.estado === 'completado');
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando boletos', err);
        // Si falla por el ID mock, simulamos
        this.boletosActivos = [];
        this.boletosCompletados = [];
        this.cargando = false;
      }
    });
  }

  // HU-003: Abordar
  abordar() {
    if (!this.nuevaProgramacionId || !this.nuevoMetodoPagoId) {
      alert('Seleccione programación y método de pago');
      return;
    }
    this.cargando = true;
    this.boletosService.abordar(this.nuevaProgramacionId, this.ciudadanoId, this.nuevoMetodoPagoId).subscribe({
      next: (res) => {
        alert('Abordaje exitoso. Boleto generado.');
        this.cargarBoletos();
      },
      error: (err) => {
        alert('Error al abordar: ' + err.message);
        this.cargando = false;
      }
    });
  }

  // HU-004: Descender
  descender(boletoId: string) {
    this.cargando = true;
    this.boletosService.descender(boletoId).subscribe({
      next: (res) => {
        alert('Viaje completado - Gracias por usar nuestro servicio');
        this.cargarBoletos();
      },
      error: (err) => {
        alert('Error al descender');
        this.cargando = false;
      }
    });
  }

  // HU-005: Ver recorrido
  verRecorrido(boleto: any) {
    this.viajeSeleccionado = boleto;
    
    // Simular renderizado del mapa
    setTimeout(() => {
      if (this.map) this.map.remove();
      this.initMap();
      this.dibujarRutaSimulada();
    }, 100);
  }

  initMap(): void {
    const mapElement = document.getElementById('map-viaje');
    if (!mapElement) return;

    this.map = L.map('map-viaje').setView([4.6097, -74.0817], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    this.routeLayer = L.featureGroup().addTo(this.map);
  }

  dibujarRutaSimulada(): void {
    if (!this.map || !this.routeLayer) return;

    // Simulamos origen y destino
    const latlngs: L.LatLngExpression[] = [
      [4.6097, -74.0817],
      [4.6200, -74.0900],
      [4.6300, -74.0700]
    ];

    L.polyline(latlngs, { color: 'green' }).addTo(this.routeLayer);
    
    L.marker(latlngs[0]).addTo(this.routeLayer).bindPopup('<b>Abordaje</b>').openPopup();
    L.marker(latlngs[latlngs.length - 1]).addTo(this.routeLayer).bindPopup('<b>Descenso</b>');

    this.map.fitBounds(this.routeLayer.getBounds(), { padding: [30, 30] });
  }

  cerrarMapa() {
    this.viajeSeleccionado = null;
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }
}
