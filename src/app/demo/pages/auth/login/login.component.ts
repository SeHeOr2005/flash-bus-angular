// angular import
import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';

@Component({
  selector: 'app-login',
  imports: [SharedModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss', '../authentication.scss']
})
export default class LoginComponent {
  // public props
  hide = true;
  email = new FormControl('', [Validators.required, Validators.email]);
  Email = 'usuario@flashbus.com';
  password = '123456';

  // public method
  getErrorMessage() {
    if (this.email.hasError('required')) {
      return 'Debes ingresar un correo electrónico';
    }

    return this.email.hasError('email') ? 'Correo electrónico no válido' : '';
  }
  loginType = [
    {
      image: 'assets/images/authentication/github.svg',
      alt: 'github',
      title: 'Iniciar sesión con GitHub'
    },
    {
      image: 'assets/images/authentication/microsoft.svg',
      alt: 'microsoft',
      title: 'Iniciar sesión con Microsoft'
    },
    {
      image: 'assets/images/authentication/google.svg',
      alt: 'google',
      title: 'Iniciar sesión con Google'
    }
  ];
}
