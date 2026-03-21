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
        path: 'ticket',
        loadComponent: () => import('./demo/pages/ticket/ticket.component')
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
