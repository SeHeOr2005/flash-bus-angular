// angular import
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { AuthService } from 'src/app/@theme/services/auth.service';
import { Observable } from 'rxjs';
import { User } from 'src/app/@theme/types/roles';

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

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  getErrorMessage() {
    if (this.email.hasError('required')) return 'Debes ingresar un correo electrónico';
    return this.email.hasError('email') ? 'Correo electrónico no válido' : '';
  }

  onLogin() {
    if (this.email.invalid || !this.password) {
      this.email.markAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
    this.authService.login(this.emailValue, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.errorMessage = 'Correo o contraseña incorrectos';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
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
    { image: 'assets/images/authentication/github.svg', alt: 'github', title: 'Iniciar sesión con GitHub' },
    { image: 'assets/images/authentication/microsoft.svg', alt: 'microsoft', title: 'Iniciar sesión con Microsoft' },
    { image: 'assets/images/authentication/google.svg', alt: 'google', title: 'Iniciar sesión con Google' }
  ];
}
