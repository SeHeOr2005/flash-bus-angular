// angular import
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  type: 'alert' | 'news' | 'maintenance' | 'safety';
  timestamp: Date;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  company?: string;
}

interface BusStop {
  id: number;
  name: string;
  location: string;
  status: 'active' | 'congestion' | 'issue';
  busesWaiting: number;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, SharedModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export default class DashboardComponent {
  recentNews: NewsItem[] = [
    {
      id: 1,
      title: 'Congestión en Parada de Versalles',
      description: 'Se reporta congestión vehicular en la parada central de Versalles. Se recomienda usar rutas alternas.',
      type: 'alert',
      timestamp: new Date(new Date().getTime() - 600000),
      icon: 'warning',
      priority: 'high',
      company: 'Todas las Empresas'
    },
    {
      id: 2,
      title: 'Cambio de Horario - Ruta Centro',
      description: 'A partir del 15 de marzo, la ruta centro modificará sus horarios en horas pico.',
      type: 'news',
      timestamp: new Date(new Date().getTime() - 1800000),
      icon: 'schedule',
      priority: 'medium',
      company: 'Transportes Flash'
    },
    {
      id: 3,
      title: 'Mantenimiento Parada La Av. Santander',
      description: 'La parada será cerrada el domingo 16 de marzo para labores de mantenimiento.',
      type: 'maintenance',
      timestamp: new Date(new Date().getTime() - 3600000),
      icon: 'build',
      priority: 'medium',
      company: 'Administración'
    },
    {
      id: 4,
      title: 'Campaña de Seguridad - Uso del Cinturón',
      description: 'Nueva campaña de seguridad en todos los buses. Recuerda usar el cinturón de seguridad.',
      type: 'safety',
      timestamp: new Date(new Date().getTime() - 7200000),
      icon: 'security',
      priority: 'low',
      company: 'Todas las Empresas'
    },
    {
      id: 5,
      title: 'Accidente menor en Av. Cardona',
      description: 'Se reportó un incidente menor en la zona. Buses desviados temporalmente.',
      type: 'alert',
      timestamp: new Date(new Date().getTime() - 10800000),
      icon: 'error_outline',
      priority: 'high',
      company: 'Operadores Locales'
    },
    {
      id: 6,
      title: 'Nuevo Servicio: Ruta Nocturna Ampliada',
      description: 'Se amplía el horario de la ruta nocturna hasta las 11:00 PM.',
      type: 'news',
      timestamp: new Date(new Date().getTime() - 14400000),
      icon: 'directions_bus',
      priority: 'low',
      company: 'Transmanizales'
    }
  ];

  busStops: BusStop[] = [
    {
      id: 1,
      name: 'Parada Centro (Versalles)',
      location: 'Centro Histórico',
      status: 'congestion',
      busesWaiting: 8,
      icon: 'location_on'
    },
    {
      id: 2,
      name: 'Parada Av. Santander',
      location: 'Norte',
      status: 'active',
      busesWaiting: 3,
      icon: 'location_on'
    },
    {
      id: 3,
      name: 'Parada Chipre',
      location: 'Occidente',
      status: 'active',
      busesWaiting: 5,
      icon: 'location_on'
    },
    {
      id: 4,
      name: 'Parada La Av. Cardona',
      location: 'Sur',
      status: 'issue',
      busesWaiting: 2,
      icon: 'location_on'
    },
    {
      id: 5,
      name: 'Parada Niza',
      location: 'Oriente',
      status: 'active',
      busesWaiting: 6,
      icon: 'location_on'
    }
  ];

  quickStats = [
    {
      label: 'Buses en Servicio',
      value: '145',
      icon: 'directions_bus',
      color: 'primary'
    },
    {
      label: 'Paradas Activas',
      value: '28',
      icon: 'location_on',
      color: 'success'
    },
    {
      label: 'Alertas Activas',
      value: '3',
      icon: 'warning',
      color: 'warn'
    },
    {
      label: 'Empresas Operando',
      value: '12',
      icon: 'business',
      color: 'info'
    }
  ];

  getNews(type: string): NewsItem[] {
    return this.recentNews.filter(news => news.type === type);
  }

  getAlertClass(priority: string): string {
    switch (priority) {
      case 'high':
        return 'alert-danger';
      case 'medium':
        return 'alert-warning';
      default:
        return 'alert-info';
    }
  }

  getStopStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'congestion':
        return 'status-congestion';
      case 'issue':
        return 'status-issue';
      default:
        return 'status-active';
    }
  }

  getStopStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Operando Normal';
      case 'congestion':
        return 'Congestión';
      case 'issue':
        return 'Problema Reportado';
      default:
        return 'Desconocido';
    }
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) {
      return `hace ${diffMins} min`;
    } else if (diffHours < 24) {
      return `hace ${diffHours} h`;
    } else {
      return date.toLocaleDateString();
    }
  }
}
