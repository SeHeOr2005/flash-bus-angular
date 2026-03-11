// angular import
import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';

@Component({
  selector: 'app-register',
  imports: [SharedModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss', '../authentication.scss']
})
export default class RegisterComponent {
  // public props
  hide = true;
  coHide = true;
  email = new FormControl('', [Validators.required, Validators.email]);

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
      title: 'Registrarse con GitHub'
    },
    {
      image: 'assets/images/authentication/microsoft.svg',
      alt: 'microsoft',
      title: 'Registrarse con Microsoft'
    },
    {
      image: 'assets/images/authentication/google.svg',
      alt: 'google',
      title: 'Registrarse con Google'
    }
  ];
}
