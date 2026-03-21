// angular import
import { Component, inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { environment } from 'src/environments/environment';

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
  errorMessage = '';

  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

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
      next: () => this.router.navigate(['/auth/login']),
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
      }
    });
  }

  loginType = [
    { image: 'assets/images/authentication/github.svg', alt: 'github', title: 'Registrarse con GitHub' },
    { image: 'assets/images/authentication/microsoft.svg', alt: 'microsoft', title: 'Registrarse con Microsoft' },
    { image: 'assets/images/authentication/google.svg', alt: 'google', title: 'Registrarse con Google' }
  ];
}
