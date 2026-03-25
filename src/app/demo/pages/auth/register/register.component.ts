// angular import
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/@theme/services/auth.service';
import { Observable } from 'rxjs';
import { User } from 'src/app/@theme/types/roles';

@Component({
  selector: 'app-register',
  imports: [SharedModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss', '../authentication.scss']
})
export default class RegisterComponent {
  hide = true;
  coHide = true;
  firstName = '';
  lastName = '';
  email = new FormControl('', [Validators.required, Validators.email]);
  password = '';
  confirmPassword = '';
  loading = false;
  socialLoading = false;
  errorMessage = '';

  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  getErrorMessage() {
    if (this.email.hasError('required')) return 'Debes ingresar un correo electrónico';
    return this.email.hasError('email') ? 'Correo electrónico no válido' : '';
  }

  onRegister() {
    if (this.email.invalid || !this.firstName || !this.password) {
      this.email.markAsTouched();
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    const name = this.lastName ? `${this.firstName} ${this.lastName}` : this.firstName;
    this.http.post(`${environment.apiUrl}/api/users/register`, { name, email: this.email.value, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.errorMessage = err.status === 409
          ? '⚠️ El correo ya está registrado. Usa otro o inicia sesión.'
          : 'Error al registrar. Intenta de nuevo.';
        this.snackBar.open(this.errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: err.status === 409 ? ['snack-warn'] : ['snack-error'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onGoogleRegister() {
    this.onSocialRegister('google');
  }

  onMicrosoftRegister() {
    this.onSocialRegister('microsoft');
  }

  onSocialRegister(provider: string) {
    if (provider === 'github') {
      return;
    }

    this.socialLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const request$: Observable<User> = provider === 'microsoft'
      ? this.authService.loginWithMicrosoft()
      : this.authService.loginWithGoogle();

    request$.subscribe({
      next: () => {
        this.socialLoading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/dashboard']);
      },
      error: (error: unknown) => {
        this.errorMessage = this.getSocialAuthErrorMessage(error, provider);
        this.snackBar.open(this.errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: ['snack-error'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.socialLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private getSocialAuthErrorMessage(error: unknown, provider: string): string {
    const providerLabel = provider === 'microsoft' ? 'Microsoft' : 'Google';
    const firebaseCode = (error as { code?: string } | null)?.code;
    if (firebaseCode === 'auth/popup-closed-by-user') return `Cerraste la ventana de ${providerLabel} antes de completar el registro.`;
    if (firebaseCode === 'auth/popup-blocked') return `El navegador bloqueó la ventana emergente de ${providerLabel}. Habilita popups e intenta de nuevo.`;
    if (firebaseCode === 'auth/cancelled-popup-request') return `Se canceló el flujo de ${providerLabel} porque hay otra ventana emergente abierta.`;
    if (firebaseCode === 'auth/account-exists-with-different-credential') return 'Ya existe una cuenta con ese correo y un proveedor distinto.';

    if (error instanceof HttpErrorResponse) {
      const backendError = (error.error as { error?: string; detail?: string } | null)?.error;
      const backendDetail = (error.error as { error?: string; detail?: string } | null)?.detail;
      return backendDetail ?? backendError ?? `El backend no pudo autenticar con ${providerLabel}. Revisa configuración OAuth/Firebase del servidor.`;
    }

    const fallback = (error as { message?: string } | null)?.message;
    return fallback ?? `No se pudo completar el registro con ${providerLabel}. Intenta de nuevo.`;
  }

  loginType = [
    { image: 'assets/images/authentication/github.svg', alt: 'github', title: 'Registrarse con GitHub' },
    { image: 'assets/images/authentication/microsoft.svg', alt: 'microsoft', title: 'Registrarse con Microsoft' },
    { image: 'assets/images/authentication/google.svg', alt: 'google', title: 'Registrarse con Google' }
  ];
}
