import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserRole } from '../types/roles';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Observable para el usuario actual
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  // Signal para el rol activo
  public activeRole = signal<UserRole | null>(this.loadActiveRoleFromStorage());

  constructor() {
    // Inicializar con datos de prueba si no hay usuario
    const user = this.loadUserFromStorage();
    
    if (!user) {
      this.setMockUser();
    } else {
      // Asegurar que el usuario tenga todos los roles (para desarrollo)
      if (!user.roles.includes(UserRole.ADMIN_SISTEMA) || user.roles.length < 5) {
        user.roles = [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA, UserRole.SUPERVISOR, UserRole.CONDUCTOR, UserRole.CIUDADANO];
        if (!user.activeRole) {
          user.activeRole = UserRole.ADMIN_SISTEMA;
        }
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }
    }
  }

  /**
   * Obtener el usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtener el rol activo
   */
  getActiveRole(): UserRole | null {
    return this.activeRole();
  }

  /**
   * Cambiar el rol activo del usuario
   */
  setActiveRole(role: UserRole): void {
    const user = this.currentUserSubject.value;
    if (user && user.roles.includes(role)) {
      user.activeRole = role;
      this.activeRole.set(role);
      localStorage.setItem('activeRole', role);
      this.currentUserSubject.next(user);
    }
  }

  /**
   * Login del usuario (simulado por ahora)
   */
  login(email: string, _password: string): Observable<User> {
    return new Observable(observer => {
      // Simulación de login - en producción iría al backend
      const mockUser: User = {
        id: '1',
        name: 'Juan Pérez',
        email: email,
        roles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA, UserRole.SUPERVISOR, UserRole.CONDUCTOR, UserRole.CIUDADANO],
        activeRole: UserRole.ADMIN_SISTEMA,
        avatar: 'assets/images/user/avatar-2.jpg'
      };

      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      localStorage.setItem('activeRole', mockUser.activeRole);

      this.currentUserSubject.next(mockUser);
      this.activeRole.set(mockUser.activeRole);

      observer.next(mockUser);
      observer.complete();
    });
  }

  /**
   * Logout del usuario
   */
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('activeRole');
    this.currentUserSubject.next(null);
    this.activeRole.set(null);
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: UserRole): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.roles.includes(role) : false;
  }

  /**
   * Verificar si el usuario activo tiene un rol específico
   */
  hasActiveRole(role: UserRole): boolean {
    return this.activeRole() === role;
  }

  /**
   * Cargar usuario del localStorage
   */
  private loadUserFromStorage(): User | null {
    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : null;
    
    // Asegurar que el usuario tenga todos los 5 roles
    if (user && user.roles) {
      const requiredRoles = [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA, UserRole.SUPERVISOR, UserRole.CONDUCTOR, UserRole.CIUDADANO];
      const hasAllRoles = requiredRoles.every(role => user.roles.includes(role));
      
      if (!hasAllRoles) {
        user.roles = requiredRoles;
        if (!user.activeRole) {
          user.activeRole = UserRole.ADMIN_SISTEMA;
        }
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
    }
    
    return user;
  }

  /**
   * Cargar rol activo del localStorage
   */
  private loadActiveRoleFromStorage(): UserRole | null {
    const role = localStorage.getItem('activeRole');
    return role as UserRole | null;
  }

  /**
   * Establecer un usuario mock para pruebas (remover en producción)
   */
  private setMockUser(): void {
    const mockUser: User = {
      id: '1',
      name: 'Juan Pérez',
      email: 'juan@example.com',
      roles: [UserRole.ADMIN_SISTEMA, UserRole.ADMIN_EMPRESA, UserRole.SUPERVISOR, UserRole.CONDUCTOR, UserRole.CIUDADANO],
      activeRole: UserRole.ADMIN_SISTEMA,
      avatar: 'assets/images/user/avatar-2.jpg'
    };

    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    localStorage.setItem('activeRole', mockUser.activeRole);

    this.currentUserSubject.next(mockUser);
    this.activeRole.set(mockUser.activeRole);
  }
}
