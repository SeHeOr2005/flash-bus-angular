// angular import
import { Component, inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { AuthService } from 'src/app/@theme/services/auth.service';

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
  errorMessage = '';

  private authService = inject(AuthService);
  private router = inject(Router);

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
    this.authService.login(this.emailValue, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.errorMessage = 'Correo o contraseña incorrectos';
        this.loading = false;
      }
    });
  }

  loginType = [
    { image: 'assets/images/authentication/github.svg', alt: 'github', title: 'Iniciar sesión con GitHub' },
    { image: 'assets/images/authentication/microsoft.svg', alt: 'microsoft', title: 'Iniciar sesión con Microsoft' },
    { image: 'assets/images/authentication/google.svg', alt: 'google', title: 'Iniciar sesión con Google' }
  ];
}
