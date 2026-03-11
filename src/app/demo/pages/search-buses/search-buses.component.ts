import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

interface BusStop {
  name: string;
  order: number;
}

interface BusRoute {
  id: number;
  name: string;
  code: string;
  color: string;
  frequency: string;
  schedule: string;
  stops: BusStop[];
  price: number;
}

interface BusCompany {
  id: number;
  name: string;
  logo: string;
  description: string;
  rating: number;
  busCount: number;
  routes: BusRoute[];
}

@Component({
  selector: 'app-search-buses',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
  ],
  templateUrl: './search-buses.component.html',
  styleUrls: ['./search-buses.component.scss']
})
export default class SearchBusesComponent {
  selectedCompanyId: number | null = null;
  selectedRoute: BusRoute | null = null;

  companies: BusCompany[] = [
    {
      id: 1,
      name: 'Transmanizales',
      logo: 'assets/images/user/avatar-2.jpg',
      description: 'Principal operador de transporte público en Manizales con más de 30 rutas urbanas.',
      rating: 4.5,
      busCount: 85,
      routes: [
        {
          id: 101, name: 'Centro - Chipre', code: 'R-101', color: '#4680FF',
          frequency: 'Cada 10 min', schedule: '5:00 AM - 10:00 PM', price: 2800,
          stops: [
            { name: 'Terminal Centro (Versalles)', order: 1 },
            { name: 'Parque Caldas', order: 2 },
            { name: 'Av. Santander - Cra 23', order: 3 },
            { name: 'Cable Plaza', order: 4 },
            { name: 'Chipre - Monumento', order: 5 }
          ]
        },
        {
          id: 102, name: 'Centro - Enea', code: 'R-102', color: '#2ca87f',
          frequency: 'Cada 15 min', schedule: '5:30 AM - 9:30 PM', price: 2800,
          stops: [
            { name: 'Terminal Centro (Versalles)', order: 1 },
            { name: 'Av. Santander', order: 2 },
            { name: 'Mall Plaza', order: 3 },
            { name: 'La Enea', order: 4 },
            { name: 'Terminal de Transporte', order: 5 }
          ]
        },
        {
          id: 103, name: 'Villamaría - Centro', code: 'R-103', color: '#dc2626',
          frequency: 'Cada 12 min', schedule: '5:00 AM - 10:00 PM', price: 2800,
          stops: [
            { name: 'Villamaría Centro', order: 1 },
            { name: 'Av. Kevin Ángel', order: 2 },
            { name: 'La Fuente', order: 3 },
            { name: 'Plaza de Bolívar', order: 4 },
            { name: 'Terminal Centro (Versalles)', order: 5 }
          ]
        },
        {
          id: 104, name: 'Centro - La Linda', code: 'R-104', color: '#e8a317',
          frequency: 'Cada 20 min', schedule: '5:30 AM - 9:00 PM', price: 2800,
          stops: [
            { name: 'Terminal Centro (Versalles)', order: 1 },
            { name: 'Cra 23 con Cll 65', order: 2 },
            { name: 'Av. Paralela', order: 3 },
            { name: 'La Linda', order: 4 }
          ]
        }
      ]
    },
    {
      id: 2,
      name: 'Transportes Flash',
      logo: 'assets/images/user/avatar-2.jpg',
      description: 'Transporte moderno con flota renovada y servicio de alta calidad en Manizales.',
      rating: 4.7,
      busCount: 45,
      routes: [
        {
          id: 201, name: 'Maltería - Centro', code: 'F-201', color: '#7c3aed',
          frequency: 'Cada 15 min', schedule: '5:00 AM - 9:30 PM', price: 2800,
          stops: [
            { name: 'Maltería', order: 1 },
            { name: 'Av. Kevin Ángel', order: 2 },
            { name: 'Fundadores', order: 3 },
            { name: 'Parque Caldas', order: 4 },
            { name: 'Terminal Centro (Versalles)', order: 5 }
          ]
        },
        {
          id: 202, name: 'Bosques del Norte - Centro', code: 'F-202', color: '#0891b2',
          frequency: 'Cada 12 min', schedule: '5:00 AM - 10:00 PM', price: 2800,
          stops: [
            { name: 'Bosques del Norte', order: 1 },
            { name: 'Av. Santander - Colegio INEM', order: 2 },
            { name: 'Cable Plaza', order: 3 },
            { name: 'Parque Caldas', order: 4 },
            { name: 'Terminal Centro (Versalles)', order: 5 }
          ]
        },
        {
          id: 203, name: 'Palermo - Niza', code: 'F-203', color: '#dc2626',
          frequency: 'Cada 18 min', schedule: '5:30 AM - 9:00 PM', price: 2800,
          stops: [
            { name: 'Palermo', order: 1 },
            { name: 'Av. Centenario', order: 2 },
            { name: 'Parque Caldas', order: 3 },
            { name: 'Av. Santander', order: 4 },
            { name: 'Niza', order: 5 }
          ]
        }
      ]
    },
    {
      id: 3,
      name: 'Buses Manizales',
      logo: 'assets/images/user/avatar-2.jpg',
      description: 'Operador con amplia cobertura en barrios periféricos y zonas rurales cercanas.',
      rating: 4.2,
      busCount: 60,
      routes: [
        {
          id: 301, name: 'Centro - Minitas', code: 'B-301', color: '#059669',
          frequency: 'Cada 15 min', schedule: '5:30 AM - 9:30 PM', price: 2800,
          stops: [
            { name: 'Terminal Centro (Versalles)', order: 1 },
            { name: 'Cra 23 con Cll 50', order: 2 },
            { name: 'Av. Paralela', order: 3 },
            { name: 'Minitas', order: 4 }
          ]
        },
        {
          id: 302, name: 'Centro - Solferino', code: 'B-302', color: '#d97706',
          frequency: 'Cada 20 min', schedule: '5:30 AM - 9:00 PM', price: 2800,
          stops: [
            { name: 'Terminal Centro (Versalles)', order: 1 },
            { name: 'Parque Caldas', order: 2 },
            { name: 'Av. 12 de Octubre', order: 3 },
            { name: 'Solferino', order: 4 }
          ]
        }
      ]
    }
  ];

  get selectedCompany(): BusCompany | null {
    if (this.selectedCompanyId === null) return null;
    return this.companies.find(c => c.id === this.selectedCompanyId) || null;
  }

  selectRoute(route: BusRoute): void {
    this.selectedRoute = this.selectedRoute?.id === route.id ? null : route;
  }

  onCompanyChange(): void {
    this.selectedRoute = null;
  }
}
