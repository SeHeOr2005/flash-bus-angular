import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BoletosService } from 'src/app/services/boletos.service';
import { AuthService } from 'src/app/@theme/services/auth.service';
import { environment } from 'src/environments/environment';

import * as L from 'leaflet';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, SharedModule, FormsModule, MatButtonModule, MatIconModule, MatTabsModule],
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.scss']
})
export default class TicketComponent implements OnInit, OnDestroy {
  ciudadanoId = '';

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

  constructor(
    private boletosService: BoletosService, 
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.email) {
      this.boletosService.getCiudadanos().subscribe(ciudadanos => {
        const matching = ciudadanos.find(c => c.email === user.email);
        if (matching) {
          this.ciudadanoId = matching._id;
          this.cargarDatosFormulario();
          this.cargarBoletos();
        }
        this.cdr.detectChanges();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  cargarDatosFormulario() {
    this.boletosService.getProgramaciones().subscribe(data => {
      this.programaciones = data;
      this.cdr.detectChanges();
    });
    
    if (this.ciudadanoId) {
      this.boletosService.getMetodosPagoCiudadano(this.ciudadanoId).subscribe(data => {
        this.metodosPago = data;
        this.cdr.detectChanges();
      });
    }
  }

  cargarBoletos() {
    this.cargando = true;
    this.boletosService.getBoletosCiudadano(this.ciudadanoId).subscribe({
      next: (data) => {
        this.boletosActivos = data.filter(b => b.estado === 'activo');
        this.boletosCompletados = data.filter(b => b.estado === 'completado');
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando boletos', err);
        // Si falla por el ID mock, simulamos
        this.boletosActivos = [];
        this.boletosCompletados = [];
        this.cargando = false;
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      }
    });
  }

  // HU-005: Ver recorrido
  verRecorrido(boleto: any) {
    this.viajeSeleccionado = boleto;
    
    setTimeout(() => {
      if (this.map) this.map.remove();
      this.initMap();
      this.dibujarRutaReal(boleto);
    }, 100);
  }

  initMap(): void {
    const mapElement = document.getElementById('map-viaje');
    if (!mapElement) return;

    this.map = L.map('map-viaje').setView([4.6097, -74.0817], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    this.routeLayer = L.featureGroup().addTo(this.map);
  }

  dibujarRutaReal(boleto: any): void {
    if (!this.map || !this.routeLayer || !boleto.ruta_id) return;

    // Fetch nodos de la ruta desde MS-Negocio
    fetch(`${environment.negocioUrl}/rutas/${boleto.ruta_id._id}/nodos`)
      .then(res => res.json())
      .then(nodos => {
        if (!nodos.length) return;
        
        const latlngs: L.LatLngExpression[] = nodos.map((n: any) => [n.latitud, n.longitud]);
        L.polyline(latlngs, { color: 'green', weight: 4 }).addTo(this.routeLayer!);
        
        // Marcamos origen (abordaje) y final (descenso)
        L.circleMarker(latlngs[0], { color: 'green', radius: 8, fillOpacity: 1 }).addTo(this.routeLayer!).bindPopup(`<b>Abordaje</b><br>${nodos[0].nombre}`).openPopup();
        L.circleMarker(latlngs[latlngs.length - 1], { color: 'red', radius: 8, fillOpacity: 1 }).addTo(this.routeLayer!).bindPopup(`<b>Descenso</b><br>${nodos[nodos.length - 1].nombre}`);

        this.map!.fitBounds(this.routeLayer!.getBounds(), { padding: [30, 30] });
      })
      .catch(err => console.error('Error fetching nodos for map', err));
  }

  cerrarMapa() {
    this.viajeSeleccionado = null;
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }
}
