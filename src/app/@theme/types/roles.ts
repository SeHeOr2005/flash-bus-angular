/**
 * Enum de Roles disponibles en el sistema
 */
export enum UserRole {
  ADMIN_SISTEMA = 'ADMIN_SISTEMA',
  ADMIN_EMPRESA = 'ADMIN_EMPRESA',
  SUPERVISOR = 'SUPERVISOR',
  CONDUCTOR = 'CONDUCTOR',
  CIUDADANO = 'CIUDADANO'
}

/**
 * Labels amigables para mostrar en UI
 */
export const RoleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN_SISTEMA]: 'Administrador Sistema',
  [UserRole.ADMIN_EMPRESA]: 'Administrador Empresa',
  [UserRole.SUPERVISOR]: 'Supervisor',
  [UserRole.CONDUCTOR]: 'Conductor',
  [UserRole.CIUDADANO]: 'Ciudadano'
};

/**
 * Interfaz para un usuario con roles
 */
export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  activeRole: UserRole;
  avatar?: string;
}

/**
 * Interfaz para la respuesta de login/autenticación
 */
export interface AuthResponse {
  user: User;
  token: string;
}
