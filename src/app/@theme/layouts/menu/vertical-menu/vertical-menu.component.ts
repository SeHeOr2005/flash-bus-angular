// Angular import
import { Component, inject, input } from '@angular/core';
import { CommonModule, Location, LocationStrategy } from '@angular/common';
import { Router } from '@angular/router';

// project import
import { NavigationItem } from 'src/app/@theme/types/navigation';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MenuItemComponent } from './menu-item/menu-item.component';
import { MenuCollapseComponent } from './menu-collapse/menu-collapse.component';
import { MenuGroupVerticalComponent } from './menu-group/menu-group.component';
import { AuthService } from 'src/app/@theme/services/auth.service';
import { getRoleDisplayLabel, UserRole } from 'src/app/@theme/types/roles';

@Component({
  selector: 'app-vertical-menu',
  imports: [SharedModule, MenuItemComponent, MenuCollapseComponent, MenuGroupVerticalComponent, CommonModule],
  templateUrl: './vertical-menu.component.html',
  styleUrls: ['./vertical-menu.component.scss']
})
export class VerticalMenuComponent {
  private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);
  private authService = inject(AuthService);
  private router = inject(Router);

  // public props
  menus = input.required<NavigationItem[]>();
  currentUser$ = this.authService.currentUser$;

  getActiveRoleLabel(): string {
    const role = this.authService.getActiveRole();
    return role ? getRoleDisplayLabel(role) : 'Sin rol';
  }

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // public method
  fireOutClick() {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      if (parent?.classList.contains('coded-hasmenu')) {
        parent.classList.add('coded-trigger');
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('coded-trigger');
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('coded-trigger');
        last_parent.classList.add('active');
      }
    }
  }
}
