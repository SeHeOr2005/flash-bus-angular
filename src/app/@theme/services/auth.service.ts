import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, map, forkJoin, of, from, catchError, throwError } from 'rxjs';
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { User, UserRole, UserPermission } from '../types/roles';
import { environment } from 'src/environments/environment';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  type Auth
} from 'firebase/auth';
import { SKIP_AUTH_401_REDIRECT } from '../interceptors/auth-context.tokens';

interface BackendCurrentUserContext {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string | null;
    authProvider?: string | null;
  };
  roles?: string[];
  permissions?: Array<{ url?: string; method?: string }>;
}

interface GoogleSyncResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string | null;
    authProvider?: string | null;
  };
  roles?: string[];
  data?: {
    token?: string;
    accessToken?: string;
    jwt?: string;
  };
}

interface PasswordRecoveryResponse {
  message: string;
}

export interface TwoFactorChallenge {
  requires2fa: true;
  challengeToken: string;
  maskedEmail: string;
  expiresAt: number;
  remainingAttempts: number;
}

interface LoginApiResponse {
  token?: string;
  requires2fa?: boolean;
  challengeToken?: string;
  maskedEmail?: string;
  expiresAt?: number;
  remainingAttempts?: number;
}

interface TwoFactorVerifyResponse {
  token: string;
}

interface TwoFactorResendResponse {
  message: string;
  expiresAt: number;
  remainingAttempts: number;
  maskedEmail: string;
}

export type LoginResult = User | TwoFactorChallenge;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  public activeRole = signal<UserRole | null>(this.loadActiveRoleFromStorage());
  private firebaseAuth: Auth | null = null;
  private trustedToken: string | null = this.getStoredTokenIfValid();
  private readonly TWO_FACTOR_STORAGE_KEY = 'pendingTwoFactorChallenge';

  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getActiveRole(): UserRole | null {
    return this.activeRole();
  }

  hasStoredToken(): boolean {
    const token = this.normalizeToken(localStorage.getItem('token'));
    return Boolean(token);
  }

  /**
   * Se ejecuta en interacción de usuario (click) para detectar manipulación
   * del token en localStorage sin esperar navegación o request al backend.
   */
  assertSessionIntegrityOnInteraction(): boolean {
    const token = this.normalizeToken(localStorage.getItem('token'));

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
    const token = this.normalizeToken(localStorage.getItem('token'));
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

  login(email: string, password: string, recaptchaToken?: string): Observable<LoginResult> {
    if (!this.isFirebaseConfigured()) {
      return this.loginWithBackendPassword(email, password, recaptchaToken);
    }

    // El backend es la fuente de verdad para login por correo/contraseña.
    // Firebase Password queda como fallback para cuentas legacy.
    return this.loginWithBackendPassword(email, password, recaptchaToken).pipe(
      catchError((backendError: unknown) => {
        if (!(backendError instanceof HttpErrorResponse) || backendError.status !== 401) {
          return throwError(() => backendError);
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
          catchError((firebaseError: unknown) => {
            if (this.shouldFallbackToBackendPassword(firebaseError)) {
              return throwError(() => backendError);
            }
            return throwError(() => firebaseError);
          })
        );
      })
    );
  }

  loginWithBackendCredentials(email: string, password: string, recaptchaToken?: string): Observable<LoginResult> {
    return this.loginWithBackendPassword(email, password, recaptchaToken);
  }

  verifyTwoFactorCode(challengeToken: string, code: string): Observable<User> {
    const allowLocal401Handling = new HttpContext().set(SKIP_AUTH_401_REDIRECT, true);

    return this.http
      .post<TwoFactorVerifyResponse>(`${this.API}/security/2fa/verify`, { challengeToken, code }, { context: allowLocal401Handling })
      .pipe(
        switchMap(({ token }) => {
          this.clearPendingTwoFactorChallenge();
          return this.hydrateSessionFromBackendToken(token);
        })
      );
  }

  resendTwoFactorCode(challengeToken: string): Observable<TwoFactorChallenge> {
    const allowLocal401Handling = new HttpContext().set(SKIP_AUTH_401_REDIRECT, true);

    return this.http
      .post<TwoFactorResendResponse>(`${this.API}/security/2fa/resend`, { challengeToken }, { context: allowLocal401Handling })
      .pipe(
        map((response) => {
          const challenge: TwoFactorChallenge = {
            requires2fa: true,
            challengeToken,
            maskedEmail: response.maskedEmail,
            expiresAt: response.expiresAt,
            remainingAttempts: response.remainingAttempts
          };
          this.savePendingTwoFactorChallenge(challenge);
          return challenge;
        })
      );
  }

  cancelPendingTwoFactorChallenge(): Observable<void> {
    const challenge = this.getPendingTwoFactorChallenge();
    if (!challenge) {
      return of(void 0);
    }

    const allowLocal401Handling = new HttpContext().set(SKIP_AUTH_401_REDIRECT, true);

    return this.http
      .post(`${this.API}/security/2fa/cancel`, { challengeToken: challenge.challengeToken }, { context: allowLocal401Handling })
      .pipe(
        map(() => {
          this.clearPendingTwoFactorChallenge();
        }),
        catchError(() => {
          this.clearPendingTwoFactorChallenge();
          return of(void 0);
        })
      );
  }

  cancelPendingTwoFactorChallengeWithBeacon(challengeToken: string): void {
    if (!challengeToken || typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
      return;
    }

    navigator.sendBeacon(`${this.API}/security/2fa/cancel/${encodeURIComponent(challengeToken)}`);
  }

  savePendingTwoFactorChallenge(challenge: TwoFactorChallenge): void {
    sessionStorage.setItem(this.TWO_FACTOR_STORAGE_KEY, JSON.stringify(challenge));
  }

  getPendingTwoFactorChallenge(): TwoFactorChallenge | null {
    const challengeStr = sessionStorage.getItem(this.TWO_FACTOR_STORAGE_KEY);
    if (!challengeStr) {
      return null;
    }

    try {
      return JSON.parse(challengeStr) as TwoFactorChallenge;
    } catch {
      return null;
    }
  }

  clearPendingTwoFactorChallenge(): void {
    sessionStorage.removeItem(this.TWO_FACTOR_STORAGE_KEY);
  }

  requestPasswordRecovery(email: string, recaptchaToken?: string): Observable<PasswordRecoveryResponse> {
    return this.http.post<PasswordRecoveryResponse>(`${this.API}/security/password-recovery/request`, {
      email,
      recaptchaToken
    });
  }

  resetPassword(token: string, newPassword: string, recaptchaToken?: string): Observable<PasswordRecoveryResponse> {
    return this.http.post<PasswordRecoveryResponse>(`${this.API}/security/password-recovery/reset`, {
      token,
      newPassword,
      recaptchaToken
    });
  }

  loginWithGoogle(): Observable<User> {
    const auth = this.getFirebaseAuth();
    const provider = new GoogleAuthProvider();

    return from(signInWithPopup(auth, provider)).pipe(
      switchMap(async ({ user: firebaseUser }) => ({
        idToken: await firebaseUser.getIdToken(),
        photoURL: firebaseUser.photoURL
      })),
      switchMap(({ idToken, photoURL }) =>
        this.http.post<GoogleSyncResponse>(`${this.API}${environment.googleAuthEndpoint}`, {
          firebaseIdToken: idToken,
          avatarUrl: photoURL
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
        idToken: await firebaseUser.getIdToken(),
        photoURL: firebaseUser.photoURL
      })),
      switchMap(({ idToken, photoURL }) =>
        this.http.post<GoogleSyncResponse>(`${this.API}${environment.googleAuthEndpoint}`, {
          firebaseIdToken: idToken,
          avatarUrl: photoURL
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
        idToken: await firebaseUser.getIdToken(),
        photoURL: firebaseUser.photoURL
      })),
      switchMap(({ idToken, photoURL }) =>
        this.http.post<GoogleSyncResponse>(`${this.API}${environment.googleAuthEndpoint}`, {
          firebaseIdToken: idToken,
          avatarUrl: photoURL
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

  updateProfile(name: string, email: string, password: string, unlinkSocialAccount = false): Observable<User> {
    const user = this.currentUserSubject.value;
    if (!user) throw new Error('No hay usuario autenticado');
    return this.http
      .put<{
        id: string;
        name: string;
        email: string;
        avatar?: string | null;
        authProvider?: string | null;
      }>(`${this.API}/api/users/${user.id}`, { name, email, password, unlinkSocialAccount })
      .pipe(
        map((updated) => {
          const hasAuthProviderField = Object.prototype.hasOwnProperty.call(updated, 'authProvider');
          const updatedUser: User = {
            ...user,
            name: updated.name,
            email: updated.email,
            avatar: Object.prototype.hasOwnProperty.call(updated, 'avatar') ? (updated.avatar ?? null) : (user.avatar ?? null),
            authProvider: hasAuthProviderField ? (updated.authProvider ?? null) : (user.authProvider ?? null)
          };
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
    this.clearPendingTwoFactorChallenge();
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

    const requestedMethod = method.trim().toUpperCase();
    const requestedUrl = this.normalizePathForPermission(url);

    return user.permissions.some((p) => {
      const permissionMethod = String(p.method ?? '')
        .trim()
        .toUpperCase();
      const permissionUrl = this.normalizePathForPermission(p.url ?? '');

      if (!permissionMethod || !permissionUrl || permissionMethod !== requestedMethod) {
        return false;
      }

      if (permissionUrl === requestedUrl) {
        return true;
      }

      // Compatibilidad con permisos de recursos dinámicos (ej. /user-role/?)
      // usados para acciones sobre IDs puntuales desde la UI.
      if (permissionUrl.endsWith('/?') && permissionUrl.slice(0, -2) === requestedUrl) {
        return true;
      }

      return this.matchesPermissionPath(permissionUrl, requestedUrl) || this.matchesPermissionPath(requestedUrl, permissionUrl);
    });
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
    const token = this.normalizeToken(localStorage.getItem('token'));
    if (!token) return null;
    return this.isTokenStructurallyValid(token) ? token : null;
  }

  private normalizeToken(token: string | null | undefined): string | null {
    if (!token) {
      return null;
    }

    const trimmed = token.trim();
    if (!trimmed) {
      return null;
    }

    return trimmed.replace(/^Bearer\s+/i, '').trim();
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
    const normalizedToken = this.normalizeToken(token);
    if (!normalizedToken || !this.isTokenStructurallyValid(normalizedToken)) {
      return throwError(() => new Error('Token JWT invalido en autenticacion.'));
    }

    localStorage.setItem('token', normalizedToken);
    this.trustedToken = normalizedToken;
    const payload = this.decodeJwtPayload(normalizedToken);

    return this.loadCurrentUserContext({
      id: payload['id'] as string,
      name: payload['name'] as string,
      email: payload['email'] as string,
      avatar: payload['avatar'] as string | null | undefined,
      authProvider: null,
      rolesFallback: []
    });
  }

  private hydrateSessionFromOAuthResponse(response: GoogleSyncResponse, token: string): Observable<User> {
    const normalizedToken = this.normalizeToken(token);
    if (!normalizedToken || !this.isTokenStructurallyValid(normalizedToken)) {
      return throwError(() => new Error('Token JWT invalido en autenticacion OAuth.'));
    }

    localStorage.setItem('token', normalizedToken);
    this.trustedToken = normalizedToken;

    const payload = this.decodeJwtPayload(normalizedToken);
    const oauthUser = response.user;
    const oauthRoles = (response.roles ?? []).map((roleName) => this.mapRole(roleName));

    return this.loadCurrentUserContext({
      id: oauthUser?.id ?? (payload['id'] as string),
      name: oauthUser?.name ?? (payload['name'] as string),
      email: oauthUser?.email ?? (payload['email'] as string),
      avatar: oauthUser?.avatar ?? (payload['avatar'] as string | null | undefined),
      authProvider: oauthUser?.authProvider ?? null,
      rolesFallback: oauthRoles
    });
  }

  private loadCurrentUserContext(fallback: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    authProvider?: string | null;
    rolesFallback: UserRole[];
  }): Observable<User> {
    return this.http.get<BackendCurrentUserContext>(`${this.API}/security/me`).pipe(
      map((ctx) => {
        const backendRoles = (ctx.roles ?? []).map((roleName) => this.mapRole(roleName));
        const finalRoles = backendRoles.length > 0 ? backendRoles : fallback.rolesFallback;
        const permissions: UserPermission[] = (ctx.permissions ?? [])
          .map((p) => ({
            url: String(p.url ?? '').trim(),
            method: String(p.method ?? '')
              .trim()
              .toUpperCase()
          }))
          .filter((p) => !!p.url && !!p.method);

        const user: User = {
          id: ctx.user?.id ?? fallback.id,
          name: ctx.user?.name ?? fallback.name,
          email: ctx.user?.email ?? fallback.email,
          avatar: ctx.user?.avatar ?? fallback.avatar ?? null,
          authProvider: ctx.user?.authProvider ?? fallback.authProvider ?? null,
          roles: finalRoles.length > 0 ? finalRoles : [UserRole.CIUDADANO],
          activeRole: finalRoles.length > 0 ? finalRoles[0] : UserRole.CIUDADANO,
          permissions
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('activeRole', user.activeRole);
        this.currentUserSubject.next(user);
        this.activeRole.set(user.activeRole);
        return user;
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          const user: User = {
            id: fallback.id,
            name: fallback.name,
            email: fallback.email,
            avatar: fallback.avatar ?? null,
            authProvider: fallback.authProvider ?? null,
            roles: fallback.rolesFallback.length > 0 ? fallback.rolesFallback : [UserRole.CIUDADANO],
            activeRole: fallback.rolesFallback.length > 0 ? fallback.rolesFallback[0] : UserRole.CIUDADANO,
            permissions: []
          };

          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('activeRole', user.activeRole);
          this.currentUserSubject.next(user);
          this.activeRole.set(user.activeRole);
          return of(user);
        }
        return throwError(() => error);
      })
    );
  }

  private normalizePathForPermission(path: string): string {
    const trimmed = String(path ?? '').trim();
    if (!trimmed) return '';

    const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash;
  }

  private matchesPermissionPath(patternPath: string, targetPath: string): boolean {
    if (!patternPath.includes('?')) {
      return false;
    }

    const escaped = patternPath.replace(/[.*+^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped.replace(/\?/g, '[^/]+')}$`);
    return regex.test(targetPath);
  }

  private extractBackendToken(response: GoogleSyncResponse): string | null {
    return (
      response.token ??
      response.accessToken ??
      response.jwt ??
      response.data?.token ??
      response.data?.accessToken ??
      response.data?.jwt ??
      null
    );
  }

  private loginWithBackendPassword(email: string, password: string, recaptchaToken?: string): Observable<LoginResult> {
    return this.http.post<LoginApiResponse>(`${this.API}/security/login`, { email, password, recaptchaToken }).pipe(
      switchMap((response) => {
        if (response.requires2fa && response.challengeToken && response.maskedEmail && response.expiresAt) {
          const challenge: TwoFactorChallenge = {
            requires2fa: true,
            challengeToken: response.challengeToken,
            maskedEmail: response.maskedEmail,
            expiresAt: response.expiresAt,
            remainingAttempts: response.remainingAttempts ?? 3
          };
          this.savePendingTwoFactorChallenge(challenge);
          return of(challenge);
        }

        if (response.token) {
          return this.hydrateSessionFromBackendToken(response.token);
        }

        return throwError(() => new Error('Respuesta de login no válida.'));
      })
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
      SUPERVISOR: UserRole.SUPERVISOR,
      CONDUCTOR: UserRole.CONDUCTOR,
      CIUDADANO: UserRole.CIUDADANO
    };
    return map[backendName] ?? (backendName as UserRole);
  }
}
