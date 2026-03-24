// angular import
import { Component, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, RouterModule } from '@angular/router';

// project import
import { SharedModule } from './demo/shared/shared.module';
import { AuthService } from './@theme/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [SharedModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  // public props
  isSpinnerVisible = true;

  // constructor
  constructor() {
    this.authService.logout();
    this.router.events.subscribe(
      (event) => {
        if (event instanceof NavigationStart) {
          this.isSpinnerVisible = true;
        } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
          this.isSpinnerVisible = false;
        }
      },
      () => {
        this.isSpinnerVisible = false;
      }
    );
  }
}
