/**
 * Enum de Roles predefinidos en el sistema.
 * Los roles dinámicos creados en el backend se almacenan como string y son compatibles.
 */
export enum UserRole {
  ADMIN_SISTEMA = 'ADMIN_SISTEMA',
  ADMIN_EMPRESA = 'ADMIN_EMPRESA',
  SUPERVISOR = 'SUPERVISOR',
  CONDUCTOR = 'CONDUCTOR',
  CIUDADANO = 'CIUDADANO'
}

/** Labels amigables para roles predefinidos */
const ROLE_LABELS: Record<string, string> = {
  ADMIN_SISTEMA: 'Administrador Sistema',
  ADMIN_EMPRESA: 'Administrador Empresa',
  SUPERVISOR: 'Supervisor',
  CONDUCTOR: 'Conductor',
  CIUDADANO: 'Ciudadano',
  // aliases del backend
  ADMINISTRADOR_SISTEMA: 'Administrador Sistema',
  ADMINISTRADOR_EMPRESA: 'Administrador Empresa'
};

/**
 * Devuelve el label amigable para cualquier rol (predefinido o dinámico).
 * Si no está en el mapa, devuelve el nombre del rol formateado.
 */
export function getRoleDisplayLabel(role: string): string {
  if (!role) return 'Sin rol';
  return (
    ROLE_LABELS[role] ??
    role
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/** Permiso individual (endpoint protegido) */
export interface UserPermission {
  url: string;
  method: string;
}

/** Usuario autenticado con roles y permisos cargados */
export interface User {
  id: string;
  name: string;
  email: string;
  authProvider?: string | null;
  roles: UserRole[];
  activeRole: UserRole;
  permissions: UserPermission[];
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
