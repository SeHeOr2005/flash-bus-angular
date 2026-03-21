import { Directive, Input, TemplateRef, ViewContainerRef, EmbeddedViewRef, inject, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../types/roles';

/**
 * Directiva estructural para control de acceso basado en permisos y roles.
 *
 * Usos:
 *   1) Permiso único:
 *      *appHasPermission="{ url: '/api/users', method: 'DELETE' }"
 *
 *   2) Varios permisos (muestra si tiene AL MENOS UNO):
 *      *appHasPermission="[{ url: '/roles', method: 'POST' }, { url: '/roles', method: 'PUT' }]"
 *
 *   3) Solo rol:
 *      *appHasPermission="{ role: 'ADMIN_SISTEMA' }"
 *
 *   4) Permiso O rol alternativo (el ADMIN_SISTEMA siempre tiene acceso):
 *      *appHasPermission="{ url: '/roles', method: 'DELETE' }"
 *      → ADMIN_SISTEMA siempre pasa aunque no tenga el permiso explícito
 */

export interface PermissionCheck {
  url?: string;
  method?: string;
  role?: string;
}

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnDestroy {
  private templateRef     = inject(TemplateRef<any>);
  private viewContainer   = inject(ViewContainerRef);
  private authService     = inject(AuthService);
  private viewRef: EmbeddedViewRef<any> | null = null;

  @Input() set appHasPermission(input: PermissionCheck | PermissionCheck[]) {
    const hasAccess = this.checkAccess(input);

    if (hasAccess && !this.viewRef) {
      this.viewRef = this.viewContainer.createEmbeddedView(this.templateRef);
    } else if (!hasAccess && this.viewRef) {
      this.viewContainer.clear();
      this.viewRef = null;
    }
  }

  private checkAccess(input: PermissionCheck | PermissionCheck[]): boolean {
    // ADMIN_SISTEMA siempre tiene acceso total
    if (this.authService.hasRole(UserRole.ADMIN_SISTEMA)) return true;

    if (Array.isArray(input)) {
      // Tiene acceso si cumple AL MENOS UN permiso de la lista
      return input.some(p => this.evalCheck(p));
    }

    return this.evalCheck(input);
  }

  private evalCheck(check: PermissionCheck): boolean {
    // Verificación por rol
    if (check.role && !check.url) {
      return this.authService.hasRole(check.role as UserRole);
    }
    // Verificación por permiso (url + method)
    if (check.url && check.method) {
      return this.authService.hasPermission(check.url, check.method);
    }
    return false;
  }

  ngOnDestroy(): void {
    this.viewContainer.clear();
    this.viewRef = null;
  }
}
