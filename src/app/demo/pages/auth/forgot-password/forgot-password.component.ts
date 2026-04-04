import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { from, switchMap } from 'rxjs';

import { SharedModule } from 'src/app/demo/shared/shared.module';
import { AuthService } from 'src/app/@theme/services/auth.service';
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
  selector: 'app-forgot-password',
  imports: [SharedModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss', '../authentication.scss']
})
export default class ForgotPasswordComponent {
  email = new FormControl('', [Validators.required, Validators.email]);
  newPassword = '';
  confirmPassword = '';
  hide = true;
  confirmHide = true;
  loading = false;
  successMessage = '';
  errorMessage = '';
  resetMode = false;
  token = '';
  private recaptchaScriptLoadingPromise: Promise<void> | null = null;

  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const token = params.get('token');
      this.resetMode = Boolean(token);
      this.token = token ?? '';
      this.errorMessage = '';
      this.successMessage = '';
      this.cdr.markForCheck();
    });
  }

  getErrorMessage() {
    if (this.email.hasError('required')) return 'Debes ingresar un correo electrónico';
    return this.email.hasError('email') ? 'Correo electrónico no válido' : '';
  }

  get passwordRequirements() {
    const value = this.newPassword;
    return {
      minLength: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      number: /\d/.test(value),
      special: /[^A-Za-z0-9]/.test(value)
    };
  }

  get isPasswordValid(): boolean {
    const req = this.passwordRequirements;
    return req.minLength && req.uppercase && req.number && req.special;
  }

  get passwordsMatch(): boolean {
    return !!this.confirmPassword && this.newPassword === this.confirmPassword;
  }

  onSubmit(): void {
    if (this.resetMode) {
      this.onResetPassword();
      return;
    }
    this.onRequestRecovery();
  }

  private onRequestRecovery(): void {
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.markForCheck();

    from(this.getRecaptchaEnterpriseToken('password_recovery_request')).pipe(
      switchMap((recaptchaToken) => this.authService.requestPasswordRecovery(this.email.value || '', recaptchaToken))
    ).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 403) {
          this.errorMessage = 'No se pudo validar reCAPTCHA. Intenta nuevamente.';
        } else {
          this.errorMessage = 'No fue posible procesar la solicitud. Intenta nuevamente.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private onResetPassword(): void {
    if (!this.token) {
      this.errorMessage = 'El enlace de recuperación no es válido.';
      return;
    }

    if (!this.isPasswordValid) {
      this.errorMessage = 'La nueva contraseña no cumple con los requisitos mínimos.';
      return;
    }

    if (!this.passwordsMatch) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.markForCheck();

    from(this.getRecaptchaEnterpriseToken('password_recovery_reset')).pipe(
      switchMap((recaptchaToken) => this.authService.resetPassword(this.token, this.newPassword, recaptchaToken))
    ).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1500);
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 403) {
          this.errorMessage = 'No se pudo validar reCAPTCHA. Intenta nuevamente.';
        } else {
          this.errorMessage = 'No fue posible restablecer la contraseña. Verifica el enlace e inténtalo de nuevo.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private async getRecaptchaEnterpriseToken(action: string): Promise<string> {
    if (!environment.recaptcha.enabled) {
      return '';
    }

    if (!environment.recaptcha.siteKey) {
      throw new Error('reCAPTCHA no configurado en frontend.');
    }

    await this.loadRecaptchaEnterpriseScript();

    return new Promise<string>((resolve, reject) => {
      if (!window.grecaptcha?.enterprise) {
        reject(new Error('reCAPTCHA Enterprise no disponible en ventana global.'));
        return;
      }

      window.grecaptcha.enterprise.ready(() => {
        window.grecaptcha?.enterprise.execute(environment.recaptcha.siteKey, { action })
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
}
