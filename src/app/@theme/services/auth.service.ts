import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, map, forkJoin, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User, UserRole, UserPermission, getRoleDisplayLabel } from '../types/roles';
import { environment } from 'src/environments/environment';

interface BackendUserRole {
  id: string;
  user: { id: string; name: string; email: string };
  role: { id: string; name: string; description: string };
}

interface BackendRolePermission {
  id: string;
  permission: { id: string; url: string; method: string; model: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  public activeRole = signal<UserRole | null>(this.loadActiveRoleFromStorage());

  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getActiveRole(): UserRole | null {
    return this.activeRole();
  }

  setActiveRole(role: UserRole): void {
    const user = this.currentUserSubject.value;
    if (user && user.roles.includes(role)) {
      user.activeRole = role;
      this.activeRole.set(role);
      localStorage.setItem('activeRole', role);
      this.currentUserSubject.next(user);
    }
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<{ token: string }>(`${this.API}/security/login`, { email, password }).pipe(
      switchMap(({ token }) => {
        localStorage.setItem('token', token);
        const payload = this.decodeJwtPayload(token);
        const userId  = payload['id'] as string;

        // 1) Obtener roles del usuario
        return this.http.get<BackendUserRole[]>(`${this.API}/user-role/user/${userId}`).pipe(
          switchMap((userRoles) => {
            const roles = userRoles.map(ur => this.mapRole(ur.role?.name));

            // 2) Cargar permisos de cada rol en paralelo
            const permObs = userRoles.length > 0
              ? forkJoin(userRoles.map(ur =>
                  this.http.get<BackendRolePermission[]>(`${this.API}/role-permission/role/${ur.role.id}`)
                ))
              : of([] as BackendRolePermission[][]);

            return permObs.pipe(
              map((permResults) => {
                const permissions: UserPermission[] = (permResults as BackendRolePermission[][])
                  .flat()
                  .map(rp => ({ url: rp.permission?.url, method: rp.permission?.method }))
                  .filter(p => !!p.url && !!p.method);

                const user: User = {
                  id:          userId,
                  name:        payload['name']  as string,
                  email:       payload['email'] as string,
                  roles:       roles.length > 0 ? roles : [UserRole.CIUDADANO],
                  activeRole:  roles.length > 0 ? roles[0] : UserRole.CIUDADANO,
                  permissions
                };

                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('activeRole', user.activeRole);
                this.currentUserSubject.next(user);
                this.activeRole.set(user.activeRole);
                return user;
              })
            );
          })
        );
      })
    );
  }

  updateProfile(name: string, email: string, password: string): Observable<User> {
    const user = this.currentUserSubject.value;
    if (!user) throw new Error('No hay usuario autenticado');
    return this.http.put<{ id: string; name: string; email: string }>(
      `${this.API}/api/users/${user.id}`, { name, email, password }
    ).pipe(
      map((updated) => {
        const updatedUser: User = { ...user, name: updated.name, email: updated.email };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
        return updatedUser;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('activeRole');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.activeRole.set(null);
  }

  hasRole(role: UserRole): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.roles.includes(role) : false;
  }

  hasActiveRole(role: UserRole): boolean {
    return this.activeRole() === role;
  }

  /** Verifica si el usuario tiene un permiso específico (por URL y método HTTP) */
  hasPermission(url: string, method: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user?.permissions) return false;
    return user.permissions.some(p => p.url === url && p.method === method);
  }

  /** Obtiene todos los permisos del usuario actual */
  getUserPermissions(): UserPermission[] {
    return this.currentUserSubject.value?.permissions ?? [];
  }

  private loadUserFromStorage(): User | null {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    const user = JSON.parse(userStr) as User;
    if (!user.permissions) user.permissions = []; // compatibilidad con sesiones anteriores
    return user;
  }

  private loadActiveRoleFromStorage(): UserRole | null {
    return localStorage.getItem('activeRole') as UserRole | null;
  }

  private decodeJwtPayload(token: string): Record<string, unknown> {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }

  /**
   * Mapea el nombre del rol del backend al enum del frontend.
   * Si no está en el mapa (rol dinámico como "VISOR"), lo usa tal cual.
   */
  private mapRole(backendName: string): UserRole {
    const map: Record<string, UserRole> = {
      ADMINISTRADOR_SISTEMA: UserRole.ADMIN_SISTEMA,
      ADMINISTRADOR_EMPRESA: UserRole.ADMIN_EMPRESA,
      SUPERVISOR:            UserRole.SUPERVISOR,
      CONDUCTOR:             UserRole.CONDUCTOR,
      CIUDADANO:             UserRole.CIUDADANO
    };
    return map[backendName] ?? (backendName as UserRole);
  }
}
