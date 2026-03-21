import { Injectable } from '@angular/core';
import { Navigation } from '../types/navigation';
import { UserRole } from '../types/roles';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MenuFilterService {
  constructor(private authService: AuthService) {}

  filterMenuByRole(menus: Navigation[], activeRole: UserRole | null): Navigation[] {
    if (!activeRole) return [];
    return menus
      .map(menu => this.filterMenuItem(menu, activeRole))
      .filter((menu): menu is Navigation => menu !== null);
  }

  private filterMenuItem(item: Navigation, activeRole: UserRole): Navigation | null {

    // ── GRUPOS: filtrar hijos primero, el grupo se muestra si hay al menos uno visible
    if (item.type === 'group') {
      if (!item.children || item.children.length === 0) return null;

      const filteredChildren = item.children
        .map(child => this.filterMenuItem(child as Navigation, activeRole))
        .filter((child): child is Navigation => child !== null);

      return filteredChildren.length > 0
        ? { ...item, children: filteredChildren }
        : null;
    }

    // ── ITEMS HOJA: verificar rol activo O permiso alternativo
    if (item.allowedRoles && item.allowedRoles.length > 0) {
      const hasRole = item.allowedRoles.includes(activeRole);

      if (!hasRole) {
        // ¿Tiene alguno de los permisos requeridos?
        const hasPermission = (item.requiredPermissions ?? []).some(
          p => this.authService.hasPermission(p.url, p.method)
        );
        if (!hasPermission) return null;
      }
    }

    return item;
  }

  getVisibleMenus(allMenus: Navigation[]): Navigation[] {
    const activeRole = this.authService.getActiveRole();
    return this.filterMenuByRole(allMenus, activeRole);
  }
}
