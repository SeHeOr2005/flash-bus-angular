import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, map, forkJoin, of, from, catchError, throwError } from 'rxjs';
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { User, UserRole, UserPermission } from '../types/roles';
import { environment } from 'src/environments/environment';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GithubAuthProvider, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut, type Auth } from 'firebase/auth';
import { SKIP_AUTH_401_REDIRECT } from '../interceptors/auth-context.tokens';

interface BackendUserRole {
  id: string;
  user: { id: string; name: string; email: string };
  role: { id: string; name: string; description: string };
}

interface BackendRolePermission {
  id: string;
  permission: { id: string; url: string; method: string; model: string };
}

interface GoogleSyncResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
  roles?: string[];
  data?: {
    token?: string;
    accessToken?: string;
    jwt?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  public activeRole = signal<UserRole | null>(this.loadActiveRoleFromStorage());
  private firebaseAuth: Auth | null = null;
  private trustedToken: string | null = this.getStoredTokenIfValid();

  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getActiveRole(): UserRole | null {
    return this.activeRole();
  }

  hasStoredToken(): boolean {
    return Boolean(localStorage.getItem('token'));
  }

  /**
   * Se ejecuta en interacción de usuario (click) para detectar manipulación
   * del token en localStorage sin esperar navegación o request al backend.
   */
  assertSessionIntegrityOnInteraction(): boolean {
    const token = localStorage.getItem('token');

    if (!token) {
      if (this.currentUserSubject.value) {
        this.logout();
        return false;
      }
      this.trustedToken = null;
      return true;
    }

    if (!this.isTokenStructurallyValid(token)) {
      this.logout();
      return false;
    }

    if (this.trustedToken && token !== this.trustedToken) {
      this.logout();
      return false;
    }

    if (!this.trustedToken) {
      this.trustedToken = token;
    }

    return true;
  }

  validateStoredSession(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token || !this.isTokenStructurallyValid(token)) {
      this.logout();
      return of(false);
    }

    if (this.trustedToken && token !== this.trustedToken) {
      this.logout();
      return of(false);
    }

    return this.http.get(`${this.API}/security/me`).pipe(
      map(() => true),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.logout();
          return of(false);
        }
        return of(true);
      })
    );
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
    if (!this.isFirebaseConfigured()) {
      return this.loginWithBackendPassword(email, password);
    }

    const auth = this.getFirebaseAuth();
    return from(signInWithEmailAndPassword(auth, email, password)).pipe(
      switchMap(async ({ user: firebaseUser }) => ({
        idToken: await firebaseUser.getIdToken()
      })),
      switchMap(({ idToken }) =>
        this.http.post<GoogleSyncResponse>(`${this.API}${environment.googleAuthEndpoint}`, {
          firebaseIdToken: idToken
        })
      ),
      switchMap((response) => {
        const token = this.extractBackendToken(response);
        if (!token) {
          throw new Error('El backend no devolvio un token JWT en la autenticacion Firebase.');
        }
        return this.hydrateSessionFromOAuthResponse(response, token);
      }),
      catchError((error: unknown) => {
        if (this.shouldFallbackToBackendPassword(error)) {
          return this.loginWithBackendPassword(email, password);
        }
        return throwError(() => error);
      })
    );
  }

  loginWithGoogle(): Observable<User> {
    const auth = this.getFirebaseAuth();
    const provider = new GoogleAuthProvider();

    return from(signInWithPopup(auth, provider)).pipe(
      switchMap(async ({ user: firebaseUser }) => ({
        idToken: await firebaseUser.getIdToken()
      })),
      switchMap(({ idToken }) =>
        this.http.post<GoogleSyncResponse>(`${this.API}${environment.googleAuthEndpoint}`, {
          firebaseIdToken: idToken
        })
      ),
      switchMap((response) => {
        const token = this.extractBackendToken(response);
        if (!token) {
          throw new Error('El backend no devolvio un token JWT en la sincronizacion Google.');
        }
        return this.hydrateSessionFromOAuthResponse(response, token);
      })
    );
  }

  loginWithMicrosoft(): Observable<User> {
    const auth = this.getFirebaseAuth();
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({ prompt: 'select_account' });

    return from(signInWithPopup(auth, provider)).pipe(
      switchMap(async ({ user: firebaseUser }) => ({
        idToken: await firebaseUser.getIdToken()
      })),
      switchMap(({ idToken }) =>
        this.http.post<GoogleSyncResponse>(`${this.API}${environment.googleAuthEndpoint}`, {
          firebaseIdToken: idToken
        })
      ),
      switchMap((response) => {
        const token = this.extractBackendToken(response);
        if (!token) {
          throw new Error('El backend no devolvio un token JWT en la sincronizacion Microsoft.');
        }
        return this.hydrateSessionFromOAuthResponse(response, token);
      })
    );
  }

  loginWithGithub(): Observable<User> {
    const auth = this.getFirebaseAuth();
    const provider = new GithubAuthProvider();

    return from(signInWithPopup(auth, provider)).pipe(
      switchMap(async ({ user: firebaseUser }) => ({
        idToken: await firebaseUser.getIdToken()
      })),
      switchMap(({ idToken }) =>
        this.http.post<GoogleSyncResponse>(`${this.API}${environment.googleAuthEndpoint}`, {
          firebaseIdToken: idToken
        })
      ),
      switchMap((response) => {
        const token = this.extractBackendToken(response);
        if (!token) {
          throw new Error('El backend no devolvio un token JWT en la sincronizacion GitHub.');
        }
        return this.hydrateSessionFromOAuthResponse(response, token);
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
    if (this.firebaseAuth) {
      void signOut(this.firebaseAuth).catch(() => {
        // No bloquea logout local si Firebase falla.
      });
    }

    localStorage.removeItem('currentUser');
    localStorage.removeItem('activeRole');
    localStorage.removeItem('token');
    this.trustedToken = null;
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

  private getStoredTokenIfValid(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return this.isTokenStructurallyValid(token) ? token : null;
  }

  private decodeJwtPayload(token: string): Record<string, unknown> {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }

  private isTokenStructurallyValid(token: string): boolean {
    try {
      const payload = this.decodeJwtPayload(token);
      const exp = payload['exp'];
      if (typeof exp !== 'number') {
        return false;
      }
      return exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private hydrateSessionFromBackendToken(token: string): Observable<User> {
    localStorage.setItem('token', token);
    this.trustedToken = token;
    const payload = this.decodeJwtPayload(token);
    const userId = payload['id'] as string;

    return this.loadRolesAndPermissionsByUserId(userId).pipe(
      map(({ roles, permissions }) => {
        const user: User = {
          id: userId,
          name: payload['name'] as string,
          email: payload['email'] as string,
          roles: roles.length > 0 ? roles : [UserRole.CIUDADANO],
          activeRole: roles.length > 0 ? roles[0] : UserRole.CIUDADANO,
          permissions
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('activeRole', user.activeRole);
        this.currentUserSubject.next(user);
        this.activeRole.set(user.activeRole);
        return user;
      })
    );
  }

  private hydrateSessionFromOAuthResponse(response: GoogleSyncResponse, token: string): Observable<User> {
    localStorage.setItem('token', token);
    this.trustedToken = token;

    const payload = this.decodeJwtPayload(token);
    const oauthUser = response.user;
    const userId = oauthUser?.id ?? (payload['id'] as string);
    const oauthRoles = (response.roles ?? []).map((roleName) => this.mapRole(roleName));

    return this.loadRolesAndPermissionsByUserId(userId).pipe(
      catchError((error: unknown) => {
        // Algunos usuarios OAuth nuevos pueden no tener permiso inicial para consultar
        // /user-role/user/{id}. En ese caso, se mantiene la sesión usando roles del login OAuth.
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return of({ roles: [] as UserRole[], permissions: [] as UserPermission[] });
        }
        return throwError(() => error);
      }),
      map(({ roles, permissions }) => {
        const finalRoles = oauthRoles.length > 0 ? oauthRoles : roles;
        const user: User = {
          id: userId,
          name: oauthUser?.name ?? (payload['name'] as string),
          email: oauthUser?.email ?? (payload['email'] as string),
          roles: finalRoles.length > 0 ? finalRoles : [UserRole.CIUDADANO],
          activeRole: finalRoles.length > 0 ? finalRoles[0] : UserRole.CIUDADANO,
          permissions
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('activeRole', user.activeRole);
        this.currentUserSubject.next(user);
        this.activeRole.set(user.activeRole);
        return user;
      })
    );
  }

  private loadRolesAndPermissionsByUserId(userId: string): Observable<{ roles: UserRole[]; permissions: UserPermission[] }> {
    const allowLocal401Handling = new HttpContext().set(SKIP_AUTH_401_REDIRECT, true);

    return this.http.get<BackendUserRole[]>(`${this.API}/user-role/user/${userId}`, {
      context: allowLocal401Handling
    }).pipe(
      switchMap((userRoles) => {
        const roles = userRoles.map((ur) => this.mapRole(ur.role?.name));
        const permObs = userRoles.length > 0
          ? forkJoin(userRoles.map((ur) => this.http.get<BackendRolePermission[]>(`${this.API}/role-permission/role/${ur.role.id}`)))
          : of([] as BackendRolePermission[][]);

        return permObs.pipe(
          map((permResults) => {
            const permissions: UserPermission[] = (permResults as BackendRolePermission[][])
              .flat()
              .map((rp) => ({ url: rp.permission?.url, method: rp.permission?.method }))
              .filter((p) => !!p.url && !!p.method);

            return { roles, permissions };
          })
        );
      })
    );
  }

  private extractBackendToken(response: GoogleSyncResponse): string | null {
    return response.token ?? response.accessToken ?? response.jwt ?? response.data?.token ?? response.data?.accessToken ?? response.data?.jwt ?? null;
  }

  private loginWithBackendPassword(email: string, password: string): Observable<User> {
    return this.http.post<{ token: string }>(`${this.API}/security/login`, { email, password }).pipe(
      switchMap(({ token }) => this.hydrateSessionFromBackendToken(token))
    );
  }

  private shouldFallbackToBackendPassword(error: unknown): boolean {
    const firebaseCode = (error as { code?: string } | null)?.code;
    if (!firebaseCode) {
      return false;
    }

    const fallbackCodes = new Set([
      'auth/invalid-credential',
      'auth/user-not-found',
      'auth/wrong-password',
      'auth/invalid-email',
      'auth/too-many-requests',
      'auth/network-request-failed',
      'auth/operation-not-allowed'
    ]);

    return fallbackCodes.has(firebaseCode);
  }

  private isFirebaseConfigured(): boolean {
    return Boolean(environment.firebase.apiKey && environment.firebase.authDomain && environment.firebase.projectId);
  }

  private getFirebaseAuth(): Auth {
    if (this.firebaseAuth) return this.firebaseAuth;

    if (!this.isFirebaseConfigured()) {
      throw new Error('Firebase no configurado. Completa environment.firebase antes de usar OAuth social.');
    }

    const app = getApps().length ? getApps()[0] : initializeApp(environment.firebase);
    this.firebaseAuth = getAuth(app);
    return this.firebaseAuth;
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
