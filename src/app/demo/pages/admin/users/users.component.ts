import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, Subject, lastValueFrom } from 'rxjs';

import { SharedModule } from 'src/app/demo/shared/shared.module';
import { UserService, BackendUser, BackendRole, BackendUserRole } from 'src/app/@theme/services/user.service';
import { AuthService } from 'src/app/@theme/services/auth.service';
import { HasPermissionDirective } from 'src/app/@theme/directives/has-permission.directive';
import { ConfirmDialogComponent } from 'src/app/@theme/components/confirm-dialog/confirm-dialog.component';

export interface UserRow extends BackendUser {
  roles: BackendUserRole[];
  loadingRoles: boolean;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatSelectModule,
    MatDialogModule,
    HasPermissionDirective,
    ConfirmDialogComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export default class UsersComponent implements OnInit {
  private userService   = inject(UserService);
  private authService   = inject(AuthService);
  private snackBar      = inject(MatSnackBar);
  private dialog        = inject(MatDialog);

  displayedColumns = ['name', 'email', 'status', 'roles', 'actions'];

  users = signal<UserRow[]>([]);
  allRoles = signal<BackendRole[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  searchQuery = '';

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();

    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe((query) => {
      if (query.trim()) {
        this.fetchUsers(this.userService.searchUsers(query), 'buscar usuarios');
      } else {
        this.loadUsers();
      }
    });
  }

  loadUsers(): void {
    this.fetchUsers(this.userService.getUsers(), 'cargar usuarios');
  }

  private async fetchUsers(users$: any, action: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    this.users.set([]);

    try {
      const [users, allUserRoles] = await Promise.all([
        lastValueFrom(users$),
        lastValueFrom(this.userService.getAllUserRoles())
      ]);
      this.mapUsers(users as BackendUser[], allUserRoles as BackendUserRole[]);
    } catch (err) {
      this.loading.set(false);
      this.handleError(err, action);
    }
  }

  private handleError(err: any, action: string): void {
    if (err.status === 401 || err.status === 403) {
      this.errorMessage.set('Sin permisos');
    } else if (err.status === 0) {
      this.errorMessage.set('Sin conexión');
    } else {
      this.errorMessage.set('Error');
    }

    const messages: Record<string, string> = {
      'Sin permisos': `Tu usuario no tiene permisos para ${action}.`,
      'Sin conexión': `No hay conexión con el servidor. Verifica que el backend esté corriendo en http://localhost:8080`,
      'Error': `Error inesperado al ${action}. Código: ${(err as any).status}`
    };

    this.snackBar.open(messages[this.errorMessage()], 'Cerrar', {
      duration: 6000,
      panelClass: ['snack-error'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private mapUsers(users: BackendUser[], allUserRoles: BackendUserRole[]): void {
    const rolesByUserId = new Map<string, BackendUserRole[]>();
    allUserRoles.forEach((ur) => {
      const uid = ur.user?.id;
      if (uid) {
        if (!rolesByUserId.has(uid)) rolesByUserId.set(uid, []);
        rolesByUserId.get(uid)!.push(ur);
      }
    });

    this.users.set(
      (users ?? []).map((u) => ({
        ...u,
        roles: rolesByUserId.get(u.id) ?? [],
        loadingRoles: false
      }))
    );
    this.loading.set(false);
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (roles) => this.allRoles.set(roles)
    });
  }

  onSearch(query: string): void {
    this.searchSubject.next(query);
  }

  deleteUser(user: UserRow): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar usuario',
        message: `¿Estás seguro de que deseas eliminar a <strong>${user.name}</strong>?`,
        detail: 'Esta acción no se puede deshacer.'
      },
      width: '420px'
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.users.update((list) => list.filter((u) => u.id !== user.id));
          this.snackBar.open('Usuario eliminado correctamente', 'Cerrar', { duration: 3000, panelClass: ['snack-success'] });
        },
        error: () => this.snackBar.open('Error al eliminar el usuario', 'Cerrar', { duration: 3000, panelClass: ['snack-error'] })
      });
    });
  }

  assignRole(user: UserRow, roleId: string): void {
    if (!roleId) return;
    this.userService.assignRole(user.id, roleId).subscribe({
      next: () => {
        this.snackBar.open('Rol asignado correctamente', 'Cerrar', { duration: 3000, panelClass: ['snack-success'] });
        this.userService.getUserRoles(user.id).subscribe((roles) => {
          this.users.update((list) =>
            list.map((u) => (u.id === user.id ? { ...u, roles } : u))
          );
        });
      },
      error: () => this.snackBar.open('Error al asignar el rol', 'Cerrar', { duration: 3000, panelClass: ['snack-error'] })
    });
  }

  removeRole(user: UserRow, userRoleId: string): void {
    this.userService.removeRole(userRoleId).subscribe({
      next: () => {
        this.users.update((list) =>
          list.map((u) =>
            u.id === user.id ? { ...u, roles: u.roles.filter((r) => r.id !== userRoleId) } : u
          )
        );
        this.snackBar.open('Rol removido correctamente', 'Cerrar', { duration: 3000, panelClass: ['snack-success'] });
      },
      error: () => this.snackBar.open('Error al remover el rol', 'Cerrar', { duration: 3000, panelClass: ['snack-error'] })
    });
  }

  getRoleLabel(roleName: string): string {
    const labels: Record<string, string> = {
      ADMINISTRADOR_SISTEMA: 'Admin Sistema',
      ADMINISTRADOR_EMPRESA: 'Admin Empresa',
      SUPERVISOR: 'Supervisor',
      CONDUCTOR: 'Conductor',
      CIUDADANO: 'Ciudadano'
    };
    return labels[roleName] ?? roleName;
  }

  getRoleColor(roleName: string): string {
    const colors: Record<string, string> = {
      ADMINISTRADOR_SISTEMA: 'chip-admin',
      ADMINISTRADOR_EMPRESA: 'chip-empresa',
      SUPERVISOR: 'chip-supervisor',
      CONDUCTOR: 'chip-conductor',
      CIUDADANO: 'chip-ciudadano'
    };
    return colors[roleName] ?? '';
  }

  canRemoveRole(): boolean {
    return this.authService.hasPermission('/user-role', 'DELETE') ||
           this.authService.hasRole('ADMIN_SISTEMA' as any);
  }

  getRolesNotAssigned(user: UserRow): BackendRole[] {
    const assigned = user.roles.map((ur) => ur.role?.id);
    return this.allRoles().filter((r) => !assigned.includes(r.id));
  }
}
