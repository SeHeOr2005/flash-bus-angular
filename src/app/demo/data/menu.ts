import { Navigation } from 'src/app/@theme/types/navigation';
import { UserRole } from 'src/app/@theme/types/roles';

export const menus: Navigation[] = [
  {
    id: 'navigation',
    title: 'Navegación',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'home',
        title: 'Página Principal',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard',
        icon: '#custom-home',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA, UserRole.SUPERVISOR, UserRole.CONDUCTOR, UserRole.CIUDADANO]
      },
      {
        id: 'chat',
        title: 'Chat',
        type: 'item',
        classes: 'nav-item',
        url: '/chat',
        icon: '#custom-chat-outline',
        allowedRoles: [UserRole.CIUDADANO]
      },
      {
        id: 'search-buses',
        title: 'Buscar Rutas',
        type: 'item',
        classes: 'nav-item',
        url: '/search-buses',
        icon: '#custom-search',
        allowedRoles: [UserRole.CIUDADANO]
      },
      {
        id: 'paraderos-cercanos',
        title: 'Paraderos Cercanos',
        type: 'item',
        classes: 'nav-item',
        url: '/paraderos-cercanos',
        icon: '#custom-map-pin',
        allowedRoles: [UserRole.CIUDADANO]
      },
      {
        id: 'ticket',
        title: 'Mis Boletos',
        type: 'item',
        classes: 'nav-item',
        url: '/ticket',
        icon: '#custom-credit-card',
        allowedRoles: [UserRole.CIUDADANO]
      },
      {
        id: 'recarga-saldo',
        title: 'Recargar Saldo (ePayco)',
        type: 'item',
        classes: 'nav-item',
        url: '/recarga-saldo',
        icon: '#custom-wallet',
        allowedRoles: [UserRole.CIUDADANO]
      }
    ]
  },
  {
    id: 'bus-management',
    title: 'Gestión de Buses',
    type: 'group',
    icon: 'icon-navigation',
    allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA],
    children: [
      {
        id: 'buses',
        title: 'Buses',
        type: 'item',
        classes: 'nav-item',
        url: '/management/buses',
        icon: '#custom-notification-status',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA]
      },
      {
        id: 'routes',
        title: 'Rutas',
        type: 'item',
        classes: 'nav-item',
        url: '/management/routes',
        icon: '#custom-map-pin',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA]
      },
      {
        id: 'stops',
        title: 'Paraderos',
        type: 'item',
        classes: 'nav-item',
        url: '/management/stops',
        icon: '#custom-map-pin',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA]
      },
      {
        id: 'drivers',
        title: 'Conductores',
        type: 'item',
        classes: 'nav-item',
        url: '/management/drivers',
        icon: '#custom-profile-2user-outline',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA]
      },
      {
        id: 'schedules',
        title: 'Programación',
        type: 'item',
        classes: 'nav-item',
        url: '/management/schedules',
        icon: '#custom-clipboard',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA]
      }
    ]
  },
  {
    id: 'supervision',
    title: 'Supervisión',
    type: 'group',
    icon: 'icon-navigation',
    allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA, UserRole.SUPERVISOR],
    children: [
      {
        id: 'monitoring',
        title: 'Monitoreo en Vivo',
        type: 'item',
        classes: 'nav-item',
        url: '/analytics',
        icon: '#custom-status-up',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA, UserRole.SUPERVISOR]
      },
      {
        id: 'incidents',
        title: 'Incidentes',
        type: 'item',
        classes: 'nav-item',
        url: '/incidents',
        icon: '#custom-alert',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA, UserRole.SUPERVISOR]
      },
      {
        id: 'trips',
        title: 'Viajes',
        type: 'item',
        classes: 'nav-item',
        url: '/management',
        icon: '#custom-clipboard',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA, UserRole.SUPERVISOR]
      },
      {
        id: 'reports',
        title: 'Analíticas de Negocio',
        type: 'item',
        classes: 'nav-item',
        url: '/analytics',
        icon: '#custom-chart',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA, UserRole.SUPERVISOR]
      }
    ]
  },
  {
    id: 'conductor-section',
    title: 'Conductor',
    type: 'group',
    icon: 'icon-navigation',
    allowedRoles: [UserRole.CONDUCTOR],
    children: [
      {
        id: 'my-trips',
        title: 'Mis Viajes',
        type: 'item',
        classes: 'nav-item',
        url: '/my-trips',
        icon: '#custom-clipboard',
        allowedRoles: [UserRole.CONDUCTOR]
      },
      {
        id: 'my-route',
        title: 'Mi Ruta',
        type: 'item',
        classes: 'nav-item',
        url: '/search-buses',
        icon: '#custom-map-pin',
        allowedRoles: [UserRole.CONDUCTOR]
      }
    ]
  },
  {
    id: 'administration',
    title: 'Administración',
    type: 'group',
    icon: 'icon-navigation',
    allowedRoles: [UserRole.ADMIN_SISTEMA],
    children: [
      {
        id: 'users',
        title: 'Usuarios',
        type: 'item',
        classes: 'nav-item',
        url: '/users',
        icon: '#custom-profile-2user-outline',
        allowedRoles: [UserRole.ADMIN_SISTEMA],
        requiredPermissions: [{ url: '/api/users', method: 'GET' }]
      },
      {
        id: 'roles',
        title: 'Roles',
        type: 'item',
        classes: 'nav-item',
        url: '/roles',
        icon: '#custom-shield',
        allowedRoles: [UserRole.ADMIN_SISTEMA],
        requiredPermissions: [{ url: '/roles', method: 'GET' }]
      },
      {
        id: 'permissions',
        title: 'Permisos',
        type: 'item',
        classes: 'nav-item',
        url: '/permissions',
        icon: '#custom-lock',
        allowedRoles: [UserRole.ADMIN_SISTEMA],
        requiredPermissions: [{ url: '/permissions', method: 'GET' }]
      },
      {
        id: 'management',
        title: 'Gestión de Buses y Rutas',
        type: 'item',
        classes: 'nav-item',
        url: '/management',
        icon: '#custom-settings',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA]
      },
      {
        id: 'companies',
        title: 'Empresas',
        type: 'item',
        classes: 'nav-item',
        url: '/management',
        icon: '#custom-building',
        allowedRoles: [UserRole.ADMIN_SISTEMA]
      },
      {
        id: 'settings',
        title: 'Configuración',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard',
        icon: '#custom-setting-outline',
        allowedRoles: [UserRole.ADMIN_SISTEMA]
      }
    ]
  }
];
