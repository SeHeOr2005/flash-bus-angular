import { Injectable } from '@angular/core';
import { Navigation } from '../types/navigation';
import { UserRole } from '../types/roles';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MenuFilterService {
  constructor(private authService: AuthService) {}

  /**
   * Filtrar el menú basándose en los roles permitidos
   */
  filterMenuByRole(menus: Navigation[], activeRole: UserRole | null): Navigation[] {
    if (!activeRole) {
      return [];
    }

    return menus
      .map(menu => this.filterMenuItem(menu, activeRole))
      .filter(menu => menu !== null) as Navigation[];
  }

  /**
   * Filtrar un item del menú recursivamente
   */
  private filterMenuItem(item: Navigation, activeRole: UserRole): Navigation | null {
    // Si el item tiene allowedRoles definidos, verificar si el rol actual está incluido
    if (item.allowedRoles && item.allowedRoles.length > 0) {
      if (!item.allowedRoles.includes(activeRole)) {
        return null;
      }
    }

    // Si tiene hijos, filtrarlos recursivamente
    if (item.children && item.children.length > 0) {
      const filteredChildren = item.children
        .map(child => this.filterMenuItem(child as Navigation, activeRole))
        .filter(child => child !== null) as Navigation[];

      // Si no quedan hijos después del filtrado, no mostrar el grupo
      if (item.type === 'group' && filteredChildren.length === 0) {
        return null;
      }

      return {
        ...item,
        children: filteredChildren
      };
    }

    return item;
  }

  /**
   * Obtener menús visibles para el rol actual
   */
  getVisibleMenus(allMenus: Navigation[]): Navigation[] {
    const activeRole = this.authService.getActiveRole();
    return this.filterMenuByRole(allMenus, activeRole);
  }
}
