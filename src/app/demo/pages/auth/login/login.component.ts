// angular import
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { AuthService, TwoFactorChallenge } from 'src/app/@theme/services/auth.service';
import { from, Observable, switchMap } from 'rxjs';
import { User } from 'src/app/@theme/types/roles';
import { environment } from 'src/environments/environment';

declare global {
  interface Window {
    grecaptcha?: {
      enterprise: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

@Component({
  selector: 'app-login',
  imports: [SharedModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss', '../authentication.scss']
})
export default class LoginComponent {
  hide = true;
  email = new FormControl('', [Validators.required, Validators.email]);
  emailValue = '';
  password = '';
  loading = false;
  socialLoading = false;
  errorMessage = '';
  sessionExpiredMessage = '';
  private recaptchaScriptLoadingPromise: Promise<void> | null = null;

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.route.queryParams.subscribe((params) => {
      if (params['reason'] === 'expired') {
        this.sessionExpiredMessage = 'Tu sesión ha expirado o fue modificada. Por favor inicia sesión nuevamente.';
      }
    });
  }

  getErrorMessage() {
    if (this.email.hasError('required')) return 'Debes ingresar un correo electrónico';
    return this.email.hasError('email') ? 'Correo electrónico no válido' : '';
  }

  onLogin() {
    if (this.email.invalid || !this.password) {
      this.email.markAsTouched();
      return;
    }

    if (environment.recaptcha.enabled && !environment.recaptcha.siteKey) {
      this.errorMessage = 'reCAPTCHA no configurado. Contacta al administrador.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    from(this.getRecaptchaEnterpriseToken()).pipe(
      switchMap((recaptchaToken) => this.authService.login(this.emailValue, this.password, recaptchaToken))
    ).subscribe({
      next: (result) => {
        this.loading = false;
        this.cdr.markForCheck();

        if (this.isTwoFactorChallenge(result)) {
          this.router.navigate(['/auth/two-factor']);
          return;
        }

        this.router.navigate(['/dashboard']);
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 403) {
          this.errorMessage = 'No se pudo validar reCAPTCHA. Intenta nuevamente.';
        } else {
          this.errorMessage = 'Correo o contraseña incorrectos';
        }
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private isTwoFactorChallenge(result: unknown): result is TwoFactorChallenge {
    return Boolean(
      result
      && (result as TwoFactorChallenge).requires2fa
      && (result as TwoFactorChallenge).challengeToken
    );
  }

  private async getRecaptchaEnterpriseToken(): Promise<string> {
    if (!environment.recaptcha.enabled) {
      return '';
    }

    await this.loadRecaptchaEnterpriseScript();

    return new Promise<string>((resolve, reject) => {
      if (!window.grecaptcha?.enterprise) {
        reject(new Error('reCAPTCHA Enterprise no disponible en ventana global.'));
        return;
      }

      window.grecaptcha.enterprise.ready(() => {
        window.grecaptcha?.enterprise.execute(environment.recaptcha.siteKey, { action: environment.recaptcha.action })
          .then(resolve)
          .catch(reject);
      });
    });
  }

  private loadRecaptchaEnterpriseScript(): Promise<void> {
    if (window.grecaptcha?.enterprise) {
      return Promise.resolve();
    }

    if (this.recaptchaScriptLoadingPromise) {
      return this.recaptchaScriptLoadingPromise;
    }

    const scriptSrc = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(environment.recaptcha.siteKey)}`;
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);

    this.recaptchaScriptLoadingPromise = new Promise<void>((resolve, reject) => {
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('No se pudo cargar reCAPTCHA Enterprise.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar reCAPTCHA Enterprise.'));
      document.head.appendChild(script);
    });

    return this.recaptchaScriptLoadingPromise;
  }

  onGoogleLogin() {
    this.onSocialLogin('google');
  }

  onMicrosoftLogin() {
    this.onSocialLogin('microsoft');
  }

  onSocialLogin(provider: string) {
    this.socialLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const request$: Observable<User> = provider === 'microsoft'
      ? this.authService.loginWithMicrosoft()
      : provider === 'github'
        ? this.authService.loginWithGithub()
        : this.authService.loginWithGoogle();

    request$.subscribe({
      next: () => {
        this.socialLoading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/dashboard']);
      },
      error: (error: unknown) => {
        this.errorMessage = this.getSocialAuthErrorMessage(error, provider);
        this.socialLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private getSocialAuthErrorMessage(error: unknown, provider: string): string {
    const providerLabel = provider === 'microsoft'
      ? 'Microsoft'
      : provider === 'github'
        ? 'GitHub'
        : 'Google';
    const firebaseCode = (error as { code?: string } | null)?.code;
    if (firebaseCode === 'auth/popup-closed-by-user') return `Cerraste la ventana de ${providerLabel} antes de completar el inicio de sesión.`;
    if (firebaseCode === 'auth/popup-blocked') return `El navegador bloqueó la ventana emergente de ${providerLabel}. Habilita popups e intenta de nuevo.`;
    if (firebaseCode === 'auth/cancelled-popup-request') return `Se canceló el flujo de ${providerLabel} porque hay otra ventana emergente abierta.`;
    if (firebaseCode === 'auth/account-exists-with-different-credential') return 'Ya existe una cuenta con ese correo y un proveedor distinto.';

    if (error instanceof HttpErrorResponse) {
      const backendError = (error.error as { error?: string; detail?: string } | null)?.error;
      const backendDetail = (error.error as { error?: string; detail?: string } | null)?.detail;
      return backendDetail ?? backendError ?? `El backend no pudo autenticar con ${providerLabel}. Revisa configuración OAuth/Firebase del servidor.`;
    }

    const fallback = (error as { message?: string } | null)?.message;
    return fallback ?? `No se pudo iniciar sesión con ${providerLabel}. Intenta de nuevo.`;
  }

  loginType = [
    { image: 'assets/images/authentication/github.svg', alt: 'github', title: 'Iniciar sesión con GitHub', shortTitle: 'GitHub' },
    { image: 'assets/images/authentication/microsoft.svg', alt: 'microsoft', title: 'Iniciar sesión con Microsoft', shortTitle: 'Microsoft' },
    { image: 'assets/images/authentication/google.svg', alt: 'google', title: 'Iniciar sesión con Google', shortTitle: 'Google' }
  ];
}
