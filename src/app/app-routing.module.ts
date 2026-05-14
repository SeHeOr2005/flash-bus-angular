import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// project import
import { AdminComponent } from './demo/layout/admin';
import { EmptyComponent } from './demo/layout/empty';
import { authGuard } from './@theme/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      },
      // Enlaces legacy del menú / bookmarks → rutas reales del proyecto
      { path: 'monitoring', redirectTo: 'analytics', pathMatch: 'full' },
      { path: 'trips', redirectTo: 'management/schedules', pathMatch: 'full' },
      { path: 'companies', redirectTo: 'management/companies', pathMatch: 'full' },
      { path: 'settings', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'my-route', redirectTo: 'search-buses', pathMatch: 'full' },
      {
        path: 'admin',
        children: [{ path: 'permissions', redirectTo: '/permissions', pathMatch: 'full' }]
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./demo/pages/dashboard/dashboard.component')
      },
      {
        path: 'chat',
        loadComponent: () => import('./demo/pages/chat/chat.component')
      },
      {
        path: 'search-buses',
        loadComponent: () => import('./demo/pages/search-buses/search-buses.component')
      },
      {
        path: 'paraderos-cercanos',
        loadComponent: () => import('./demo/pages/paraderos-cercanos/paraderos-cercanos.component')
      },
      {
        path: 'ticket',
        loadComponent: () => import('./demo/pages/ticket/ticket.component')
      },
      {
        path: 'recarga-saldo',
        loadComponent: () => import('./demo/pages/recarga-saldo/recarga-saldo.component')
      },
      {
        path: 'my-trips',
        loadComponent: () => import('./demo/pages/conductor-trips/conductor-trips.component')
      },
      {
        path: 'incidents',
        loadComponent: () => import('./demo/pages/incidents-dashboard/incidents-dashboard.component')
      },
      {
        path: 'management/:section',
        loadComponent: () => import('./demo/pages/management/management.component')
      },
      {
        path: 'management',
        redirectTo: 'management/buses',
        pathMatch: 'full'
      },
      {
        path: 'analytics',
        loadComponent: () => import('./demo/pages/analytics-dashboard/analytics-dashboard.component')
      },
      {
        path: 'component',
        loadChildren: () => import('./demo/pages/components/component.module').then((m) => m.ComponentModule)
      },
      {
        path: 'sample-page',
        loadComponent: () => import('./demo/pages/other/sample-page/sample-page.component')
      },
      {
        path: 'users',
        loadComponent: () => import('./demo/pages/admin/users/users.component')
      },
      {
        path: 'roles',
        loadComponent: () => import('./demo/pages/admin/roles/roles.component')
      },
      {
        path: 'permissions',
        loadComponent: () => import('./demo/pages/admin/permissions/permissions.component')
      }
    ]
  },
  {
    path: '',
    component: EmptyComponent,
    children: [
      {
        path: 'auth',
        loadChildren: () => import('./demo/pages/auth/auth.module').then((m) => m.AuthModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
