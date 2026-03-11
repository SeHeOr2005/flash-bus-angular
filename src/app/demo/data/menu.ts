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
        allowedRoles: [
          UserRole.ADMIN_SISTEMA,
          UserRole.ADMIN_EMPRESA,
          UserRole.SUPERVISOR,
          UserRole.CONDUCTOR,
          UserRole.CIUDADANO
        ]
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
        title: 'Buscar Buses',
        type: 'item',
        classes: 'nav-item',
        url: '/search-buses',
        icon: '#custom-search',
        allowedRoles: [UserRole.CIUDADANO]
      },
      {
        id: 'ticket',
        title: 'Tarjeta',
        type: 'item',
        classes: 'nav-item',
        url: '/ticket',
        icon: '#custom-credit-card',
        allowedRoles: [UserRole.CIUDADANO]
      }
    ]
  },
  {
    id: 'auth',
    title: 'Autenticación',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'Login',
        title: 'Login',
        type: 'item',
        classes: 'nav-item',
        url: '/auth/login',
        icon: '#custom-shield',
        target: true,
        breadcrumbs: false,
        allowedRoles: [] // Solo visible sin login
      },
      {
        id: 'register',
        title: 'Registrarse',
        type: 'item',
        classes: 'nav-item',
        url: '/auth/register',
        icon: '#custom-password-check',
        target: true,
        breadcrumbs: false,
        allowedRoles: [] // Solo visible sin login (CIUDADANO para nuevos registros)
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
        url: '/buses',
        icon: '#custom-notification-status',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA]
      },
      {
        id: 'routes',
        title: 'Rutas',
        type: 'item',
        classes: 'nav-item',
        url: '/routes',
        icon: '#custom-map-pin',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA]
      },
      {
        id: 'drivers',
        title: 'Conductores',
        type: 'item',
        classes: 'nav-item',
        url: '/drivers',
        icon: '#custom-profile-2user-outline',
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
        url: '/monitoring',
        icon: '#custom-status-up',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA, UserRole.SUPERVISOR]
      },
      {
        id: 'trips',
        title: 'Viajes',
        type: 'item',
        classes: 'nav-item',
        url: '/trips',
        icon: '#custom-clipboard',
        allowedRoles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA, UserRole.SUPERVISOR]
      },
      {
        id: 'reports',
        title: 'Reportes',
        type: 'item',
        classes: 'nav-item',
        url: '/reports',
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
        url: '/my-route',
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
        allowedRoles: [UserRole.ADMIN_SISTEMA]
      },
      {
        id: 'companies',
        title: 'Empresas',
        type: 'item',
        classes: 'nav-item',
        url: '/companies',
        icon: '#custom-building',
        allowedRoles: [UserRole.ADMIN_SISTEMA]
      },
      {
        id: 'settings',
        title: 'Configuración',
        type: 'item',
        classes: 'nav-item',
        url: '/settings',
        icon: '#custom-setting-outline',
        allowedRoles: [UserRole.ADMIN_SISTEMA]
      }
    ]
  }
];
