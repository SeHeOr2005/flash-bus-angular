// Angular import
import { Component, OnInit, inject, viewChild, OnDestroy } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDrawer, MatDrawerMode } from '@angular/material/sidenav';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe } from '@angular/common';

// Project import
import { menus } from 'src/app/demo/data/menu';
import { LayoutService } from 'src/app/@theme/services/layout.service';
import { AuthService } from 'src/app/@theme/services/auth.service';
import { MenuFilterService } from 'src/app/@theme/services/menu-filter.service';
import { Navigation } from 'src/app/@theme/types/navigation';
import { environment } from 'src/environments/environment';
import { FooterComponent } from 'src/app/@theme/layouts/footer/footer.component';
import { BreadcrumbComponent } from 'src/app/@theme/layouts/breadcrumb/breadcrumb.component';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { NavBarComponent } from 'src/app/@theme/layouts/toolbar/toolbar.component';
import { VerticalMenuComponent } from 'src/app/@theme/layouts/menu/vertical-menu';

@Component({
  selector: 'app-admin',
  imports: [FooterComponent, BreadcrumbComponent, SharedModule, RouterModule, NavBarComponent, VerticalMenuComponent, AsyncPipe],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {
  private breakpointObserver = inject(BreakpointObserver);
  private layoutService = inject(LayoutService);
  private authService = inject(AuthService);
  private menuFilterService = inject(MenuFilterService);

  // public props
  sidebar = viewChild<MatDrawer>('sidebar');
  menus = new BehaviorSubject<Navigation[]>([]);
  modeValue: MatDrawerMode = 'side';
  currentApplicationVersion = environment.appVersion;

  // life cycle event
  ngOnInit() {
    // Inicializar menús filtrados según el rol actual
    this.updateMenus();

    // Suscribirse a cambios de rol activo
    this.authService.currentUser$.subscribe(() => {
      this.updateMenus();
    });

    this.breakpointObserver.observe(['(min-width: 1025px)', '(max-width: 1024.98px)']).subscribe((result) => {
      if (result.breakpoints['(max-width: 1024.98px)']) {
        this.modeValue = 'over';
      } else if (result.breakpoints['(min-width: 1025px)']) {
        this.modeValue = 'side';
      }
    });

    this.layoutService.dashBoardMenuState.subscribe(() => {
      this.sidebar()?.toggle();
    });
  }

  ngOnDestroy() {
    this.menus.complete();
  }

  /**
   * Actualizar menús según el rol activo
   */
  private updateMenus(): void {
    const filteredMenus = this.menuFilterService.getVisibleMenus(menus);
    this.menus.next(filteredMenus);
  }
}
