// angular import
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { RoleSelectorComponent } from '../role-selector/role-selector.component';
import { AuthService } from 'src/app/@theme/services/auth.service';
import { ProfileEditDialogComponent } from '../profile-edit-dialog/profile-edit-dialog.component';

@Component({
  selector: 'app-nav-right',
  imports: [CommonModule, SharedModule, RoleSelectorComponent, MatDialogModule],
  templateUrl: './toolbar-right.component.html',
  styleUrls: ['./toolbar-right.component.scss']
})
export class NavRightComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  currentUser$ = this.authService.currentUser$;

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  openEditProfile(): void {
    this.dialog.open(ProfileEditDialogComponent, {
      width: '440px',
      disableClose: false
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
