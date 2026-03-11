// Angular Import
import { Component, inject, input, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterModule, Event } from '@angular/router';
import { Title } from '@angular/platform-browser';

// project import
import { NavigationItem } from '../../types/navigation';
import { AuthService } from '../../services/auth.service';
import { MenuFilterService } from '../../services/menu-filter.service';

import { menus } from 'src/app/demo/data/menu';

interface titleType {
  // eslint-disable-next-line
  url: string | boolean | any | undefined;
  title: string;
  breadcrumbs: unknown;
  type: string;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  private route = inject(Router);
  private titleService = inject(Title);
  private authService = inject(AuthService);
  private menuFilterService = inject(MenuFilterService);

  // public props
  Component = input(false);
  dashboard = input(true);

  navigations: NavigationItem[];
  breadcrumbList: Array<string> = [];
  navigationList!: titleType[];

  // constructor
  constructor() {
    this.navigations = this.getFilteredMenus();
    this.setBreadcrumb();
  }

  ngOnInit() {
    // Actualizar breadcrumb cuando cambia el rol
    this.authService.currentUser$.subscribe(() => {
      this.navigations = this.getFilteredMenus();
      this.setBreadcrumb();
    });
  }

  ngOnDestroy() {
    // Limpiar suscripciones si es necesario
  }

  /**
   * Obtener menús filtrados según el rol activo
   */
  private getFilteredMenus(): NavigationItem[] {
    return this.menuFilterService.getVisibleMenus(menus) as NavigationItem[];
  }

  // public method
  setBreadcrumb() {
    this.route.events.subscribe((router: Event) => {
      if (router instanceof NavigationEnd) {
        const activeLink = router.url;
        const breadcrumbList = this.filterNavigation(this.navigations, activeLink);
        this.navigationList = breadcrumbList;
        const title = breadcrumbList[breadcrumbList.length - 1]?.title || 'Welcome';
        this.titleService.setTitle(title + ' | Flash Bus - Sistema de Gestión de Transporte');
      }
    });
  }

  filterNavigation(navItems: NavigationItem[], activeLink: string): titleType[] {
    for (const navItem of navItems) {
      if (navItem.type === 'item' && 'url' in navItem && navItem.url === activeLink) {
        return [
          {
            url: 'url' in navItem ? navItem.url : false,
            title: navItem.title,
            breadcrumbs: 'breadcrumbs' in navItem ? navItem.breadcrumbs : true,
            type: navItem.type
          }
        ];
      }
      if ((navItem.type === 'group' || navItem.type === 'collapse') && 'children' in navItem) {
        const breadcrumbList = this.filterNavigation(navItem.children!, activeLink);
        if (breadcrumbList.length > 0) {
          breadcrumbList.unshift({
            url: 'url' in navItem ? navItem.url : false,
            title: navItem.title,
            breadcrumbs: 'breadcrumbs' in navItem ? navItem.breadcrumbs : true,
            type: navItem.type
          });
          return breadcrumbList;
        }
      }
    }
    return [];
  }
}
