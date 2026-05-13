import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ViajesService } from 'src/app/services/viajes.service';

import * as L from 'leaflet';

// Fix for leaflet icons in Angular
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-search-buses',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './search-buses.component.html',
  styleUrls: ['./search-buses.component.scss']
})
export default class SearchBusesComponent implements OnInit, AfterViewInit, OnDestroy {
  rutas: any[] = [];
  rutasFiltradas: any[] = [];
  filtroNombre: string = '';
  
  rutaSeleccionada: any = null;
  nodosRuta: any[] = [];
  
  map: L.Map | undefined;
  routeLayer: L.FeatureGroup | undefined;

  cargando = true;

  constructor(private viajesService: ViajesService) {}

  ngOnInit(): void {
    this.cargarRutas();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  cargarRutas() {
    this.cargando = true;
    this.viajesService.getRutas().subscribe({
      next: (data) => {
        // En nuestro modelo no hay campo tarifa explícito, asumimos que se sacaría del boleto o le ponemos uno por defecto para la vista.
        // O si la agregamos luego a la ruta. Por ahora la mockeamos si no viene.
        this.rutas = data.map(r => ({ ...r, tarifa: r.tarifa || 2950 }));
        this.rutasFiltradas = [...this.rutas];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando rutas', err);
        this.cargando = false;
      }
    });
  }

  filtrarRutas() {
    if (!this.filtroNombre) {
      this.rutasFiltradas = [...this.rutas];
    } else {
      const termino = this.filtroNombre.toLowerCase();
      this.rutasFiltradas = this.rutas.filter(r => r.nombre.toLowerCase().includes(termino));
    }
  }

  seleccionarRuta(ruta: any) {
    if (this.rutaSeleccionada?._id === ruta._id) {
      // Deseleccionar
      this.rutaSeleccionada = null;
      this.nodosRuta = [];
      if (this.routeLayer) this.routeLayer.clearLayers();
      return;
    }
    
    this.rutaSeleccionada = ruta;
    this.viajesService.getNodosRuta(ruta._id).subscribe({
      next: (nodos) => {
        this.nodosRuta = nodos;
        this.dibujarRutaEnMapa();
      },
      error: (err) => console.error('Error cargando nodos', err)
    });
  }

  initMap(): void {
    // Coordenadas por defecto (Bogotá o Manizales, según el contexto. Pongamos Bogotá centro)
    this.map = L.map('map', {
      center: [4.6097, -74.0817],
      zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.routeLayer = L.featureGroup().addTo(this.map);
  }

  dibujarRutaEnMapa(): void {
    if (!this.map || !this.routeLayer || !this.nodosRuta.length) return;
    
    this.routeLayer.clearLayers();

    const latlngs: L.LatLngExpression[] = [];

    this.nodosRuta.forEach((nodo, index) => {
      const latlng: L.LatLngExpression = [nodo.latitud, nodo.longitud];
      latlngs.push(latlng);

      // Crear marcador para cada nodo/paradero
      const isStart = index === 0;
      const isEnd = index === this.nodosRuta.length - 1;
      
      let markerColor = 'blue';
      if (isStart) markerColor = 'green';
      if (isEnd) markerColor = 'red';

      const circleMarker = L.circleMarker(latlng, {
        radius: 6,
        fillColor: markerColor,
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).bindPopup(`<b>${nodo.nombre}</b><br/>Orden: ${nodo.orden}`);
      
      this.routeLayer?.addLayer(circleMarker);
    });

    // Dibujar línea conectando los nodos
    const polyline = L.polyline(latlngs, { color: '#4680FF', weight: 4, opacity: 0.7 });
    this.routeLayer.addLayer(polyline);

    // Ajustar vista del mapa para que quepa toda la ruta
    this.map.fitBounds(this.routeLayer.getBounds(), { padding: [50, 50] });
  }
}
