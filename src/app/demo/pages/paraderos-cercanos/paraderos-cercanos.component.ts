import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ViajesService } from 'src/app/services/viajes.service';

import * as L from 'leaflet';

@Component({
  selector: 'app-paraderos-cercanos',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './paraderos-cercanos.component.html',
  styleUrls: ['./paraderos-cercanos.component.scss']
})
export default class ParaderosCercanosComponent implements OnInit, AfterViewInit, OnDestroy {
  paraderos: any[] = [];
  cargando = false;
  errorLocalizacion = '';

  map: L.Map | undefined;
  markersLayer: L.FeatureGroup | undefined;
  userMarker: L.Marker | undefined;

  constructor(private viajesService: ViajesService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.buscarUbicacion();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  initMap(): void {
    this.map = L.map('map-paraderos', {
      center: [4.6097, -74.0817], // Centro por defecto (Bogotá/Colombia)
      zoom: 12
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.markersLayer = L.featureGroup().addTo(this.map);
  }

  buscarUbicacion() {
    this.cargando = true;
    this.errorLocalizacion = '';

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.marcarUsuario(lat, lng);
          this.buscarParaderos(lat, lng);
        },
        (error) => {
          this.cargando = false;
          this.errorLocalizacion = 'No se pudo acceder a tu ubicación. Por favor, habilita el GPS.';
          console.error(error);
        },
        { enableHighAccuracy: true }
      );
    } else {
      this.cargando = false;
      this.errorLocalizacion = 'Tu navegador no soporta geolocalización.';
    }
  }

  marcarUsuario(lat: number, lng: number) {
    if (!this.map) return;

    if (this.userMarker) {
      this.userMarker.setLatLng([lat, lng]);
    } else {
      // Icono personalizado para el usuario
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div class="pulse"></div>',
        iconSize: [20, 20]
      });

      this.userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
      this.userMarker.bindPopup('<b>Tú estás aquí</b>').openPopup();
    }

    this.map.setView([lat, lng], 15);
  }

  buscarParaderos(lat: number, lng: number) {
    this.viajesService.getParaderosCercanos(lat, lng).subscribe({
      next: (data) => {
        this.paraderos = data;
        this.dibujarParaderos();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error', err);
        this.cargando = false;
      }
    });
  }

  dibujarParaderos() {
    if (!this.markersLayer || !this.map) return;
    this.markersLayer.clearLayers();

    this.paraderos.forEach(p => {
      const marker = L.marker([p.latitud, p.longitud]).bindPopup(`
        <b>${p.nombre}</b><br/>
        Distancia: ${p.distancia} m
      `);
      this.markersLayer?.addLayer(marker);
    });

    if (this.paraderos.length > 0 && this.userMarker) {
      // Agrupar marcadores más el usuario para centrar el mapa
      const group = new L.FeatureGroup([this.userMarker, ...this.markersLayer.getLayers()]);
      this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }

  enfocarParadero(p: any) {
    if (!this.map) return;
    this.map.setView([p.latitud, p.longitud], 17);
  }
}
