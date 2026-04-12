import { Component, inject, signal, computed, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { lastValueFrom } from 'rxjs';

import { SharedModule } from 'src/app/demo/shared/shared.module';
import { RoleService, BackendPermission, BackendRolePermission } from 'src/app/@theme/services/role.service';
import { BackendRole } from 'src/app/@theme/services/user.service';
import { AuthService } from 'src/app/@theme/services/auth.service';
import { UserRole } from 'src/app/@theme/types/roles';
import { HasPermissionDirective } from 'src/app/@theme/directives/has-permission.directive';
import { ConfirmDialogComponent } from 'src/app/@theme/components/confirm-dialog/confirm-dialog.component';

// ── Dialog: Crear / Editar Rol ──────────────────────────────────────────────
@Component({
  selector: 'app-role-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>{{ data ? 'edit' : 'add_circle' }}</mat-icon>
      {{ data ? 'Editar Rol' : 'Nuevo Rol' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-content">
        <mat-form-field appearance="outline" class="w-100 m-b-12">
          <mat-label>Nombre del rol</mat-label>
          <mat-icon matPrefix>badge</mat-icon>
          <input matInput formControlName="name" placeholder="Ej: SUPERVISOR" />
          <mat-hint>Usa mayúsculas y guiones bajos</mat-hint>
          <mat-error *ngIf="form.get('name')?.hasError('required')">El nombre es requerido</mat-error>
          <mat-error *ngIf="form.get('name')?.hasError('minlength')">Mínimo 3 caracteres</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Descripción</mat-label>
          <mat-icon matPrefix>description</mat-icon>
          <textarea matInput formControlName="description" placeholder="Describe las funciones del rol" rows="3"></textarea>
          <mat-error *ngIf="form.get('description')?.hasError('required')">La descripción es requerida</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancelar</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="form.invalid || saving()">
        <mat-spinner *ngIf="saving()" diameter="18"></mat-spinner>
        <span *ngIf="!saving()">{{ data ? 'Guardar' : 'Crear' }}</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .form-content {
        padding-top: 8px;
        min-width: 360px;
      }
      .w-100 {
        width: 100%;
      }
      .m-b-12 {
        margin-bottom: 12px;
      }
    `
  ]
})
export class RoleFormDialogComponent {
  private fb = inject(FormBuilder);
  saving = signal(false);

  form = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required, Validators.minLength(3)]],
    description: [this.data?.description ?? '', Validators.required]
  });

  constructor(
    public dialogRef: MatDialogRef<RoleFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BackendRole | null
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value);
  }
}

// ── Dialog: Gestionar Permisos de un Rol ────────────────────────────────────
@Component({
  selector: 'app-role-permissions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>security</mat-icon>
      Permisos — {{ data.role.name }}
    </h2>

    <mat-dialog-content class="perm-content">
      <!-- Permisos asignados -->
      <p class="section-label">Permisos asignados ({{ assigned().length }})</p>

      <div *ngIf="loadingAssigned()" class="center-spin">
        <mat-spinner diameter="32"></mat-spinner>
      </div>

      <div *ngIf="!loadingAssigned() && assigned().length === 0" class="empty-msg">
        <mat-icon>lock_open</mat-icon>
        <span>Sin permisos asignados</span>
      </div>

      <div class="chips-wrap" *ngIf="!loadingAssigned() && assigned().length > 0">
        <span
          *ngFor="let rp of assigned()"
          class="perm-chip"
          [ngClass]="methodClass(rp.permission?.method)"
          [class.chip-readonly]="!canRevoke()"
          [matTooltip]="canRevoke() ? 'Clic para remover' : rp.permission?.url"
          (click)="canRevoke() && removePermission(rp)"
        >
          <strong>{{ rp.permission?.method }}</strong>
          {{ rp.permission?.url }}
          <mat-icon class="chip-x" *ngIf="canRevoke()">close</mat-icon>
        </span>
      </div>

      <mat-divider class="divider"></mat-divider>

      <!-- Agregar permiso — solo si tiene permiso -->
      <ng-container *ngIf="canAssign()">
        <p class="section-label">Agregar permiso</p>
        <div class="add-row">
          <mat-form-field appearance="outline" class="sel-field">
            <mat-label>Selecciona un permiso</mat-label>
            <mat-select [(ngModel)]="selectedPermissionId">
              <mat-option *ngFor="let p of available()" [value]="p.id">
                <span [ngClass]="'method-badge ' + methodClass(p.method)">{{ p.method }}</span>
                {{ p.url }} <span class="model-tag">{{ p.model }}</span>
              </mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-flat-button color="primary" [disabled]="!selectedPermissionId || adding()" (click)="addPermission()">
            <mat-spinner *ngIf="adding()" diameter="18"></mat-spinner>
            <mat-icon *ngIf="!adding()">add</mat-icon>
          </button>
        </div>
      </ng-container>
      <p class="readonly-msg" *ngIf="!canAssign()">
        <mat-icon>info</mat-icon> Solo lectura — no tienes permiso para modificar permisos de roles
      </p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="changed">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .perm-content {
        min-width: 480px;
        max-height: 500px;
        padding-top: 8px;
      }
      .section-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #888;
        margin: 4px 0 10px;
      }
      .center-spin {
        display: flex;
        justify-content: center;
        padding: 12px 0;
      }
      .empty-msg {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #aaa;
        font-size: 13px;
        padding: 8px 0;
      }
      .chips-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 4px;
      }
      .divider {
        margin: 14px 0;
      }
      .add-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .sel-field {
        flex: 1;
      }
      .model-tag {
        font-size: 11px;
        color: #aaa;
        margin-left: 4px;
      }
      .method-badge {
        font-size: 10px;
        font-weight: 700;
        padding: 1px 5px;
        border-radius: 4px;
        margin-right: 6px;
      }
      .perm-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 20px;
        cursor: pointer;
        user-select: none;
      }
      .perm-chip:hover {
        opacity: 0.8;
      }
      .perm-chip.chip-readonly {
        cursor: default;
      }
      .perm-chip.chip-readonly:hover {
        opacity: 1;
      }
      .chip-x {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
      .readonly-msg {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #999;
        margin-top: 4px;
      }
      .readonly-msg mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      .method-get {
        background: #e3f2fd;
        color: #1565c0;
      }
      .method-post {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .method-put {
        background: #fff3e0;
        color: #e65100;
      }
      .method-delete {
        background: #fce4ec;
        color: #c62828;
      }
    `
  ]
})
export class RolePermissionsDialogComponent implements OnInit {
  private roleService = inject(RoleService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  assigned = signal<BackendRolePermission[]>([]);
  allPerms = signal<BackendPermission[]>([]);
  loadingAssigned = signal(true);
  adding = signal(false);
  selectedPermissionId = '';
  changed = false;

  canAssign(): boolean {
    return this.authService.hasPermission('/role-permission', 'POST') || this.authService.hasRole(UserRole.ADMIN_SISTEMA);
  }
  canRevoke(): boolean {
    return this.authService.hasPermission('/role-permission', 'DELETE') || this.authService.hasRole(UserRole.ADMIN_SISTEMA);
  }

  constructor(
    public dialogRef: MatDialogRef<RolePermissionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { role: BackendRole }
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loadingAssigned.set(true);
    const [assigned, all] = await Promise.all([
      lastValueFrom(this.roleService.getRolePermissions(this.data.role.id)),
      lastValueFrom(this.roleService.getPermissions())
    ]);
    this.assigned.set(assigned);
    this.allPerms.set(all);
    this.loadingAssigned.set(false);
  }

  available(): BackendPermission[] {
    const assignedIds = this.assigned().map((rp) => rp.permission?.id);
    return this.allPerms().filter((p) => !assignedIds.includes(p.id));
  }

  addPermission(): void {
    if (!this.selectedPermissionId) return;
    this.adding.set(true);
    this.roleService.assignPermissionToRole(this.data.role.id, this.selectedPermissionId).subscribe({
      next: () => {
        this.adding.set(false);
        this.changed = true;
        this.selectedPermissionId = '';
        this.loadData();
        this.snackBar.open('Permiso asignado ✓', 'Cerrar', { duration: 2500, panelClass: ['snack-success'] });
      },
      error: () => {
        this.adding.set(false);
        this.snackBar.open('Error al asignar permiso', 'Cerrar', { duration: 3000, panelClass: ['snack-error'] });
      }
    });
  }

  removePermission(rp: BackendRolePermission): void {
    this.roleService.removePermissionFromRole(rp.id).subscribe({
      next: () => {
        this.assigned.update((list) => list.filter((r) => r.id !== rp.id));
        this.changed = true;
        this.snackBar.open('Permiso removido ✓', 'Cerrar', { duration: 2500, panelClass: ['snack-success'] });
      },
      error: () => this.snackBar.open('Error al remover permiso', 'Cerrar', { duration: 3000, panelClass: ['snack-error'] })
    });
  }

  methodClass(method: string): string {
    return { GET: 'method-get', POST: 'method-post', PUT: 'method-put', DELETE: 'method-delete' }[method] ?? '';
  }
}

// ── Componente Principal: Gestión de Roles ──────────────────────────────────
@Component({
  selector: 'app-roles',
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
    MatDialogModule,
    MatBadgeModule,
    HasPermissionDirective
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export default class RolesComponent implements OnInit {
  private roleService = inject(RoleService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  displayedColumns = ['name', 'description', 'permissions', 'actions'];

  roles = signal<(BackendRole & { permCount: number })[]>([]);
  allPermissions = signal<BackendPermission[]>([]);
  rolePermissions = signal<Map<string, BackendRolePermission[]>>(new Map());
  loading = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadAll();
  }

  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const roles = await lastValueFrom(this.roleService.getRoles());

      // Solo consultar permisos por rol cuando el usuario tenga autorización explícita.
      if (this.canReadRolePermissions()) {
        const permResults = await Promise.all(roles.map((r) => lastValueFrom(this.roleService.getRolePermissions(r.id))));

        const map = new Map<string, BackendRolePermission[]>();
        roles.forEach((r, i) => map.set(r.id, permResults[i]));
        this.rolePermissions.set(map);
        this.roles.set(roles.map((r) => ({ ...r, permCount: (map.get(r.id) ?? []).length })));
      } else {
        this.rolePermissions.set(new Map());
        this.roles.set(roles.map((r) => ({ ...r, permCount: 0 })));
      }

      this.loading.set(false);
    } catch {
      this.loading.set(false);
      this.errorMessage.set('Error al cargar los roles');
    }
  }

  openRoleForm(role: BackendRole | null = null): void {
    const ref = this.dialog.open(RoleFormDialogComponent, { data: role, width: '440px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      if (role) {
        this.roleService.updateRole(role.id, result).subscribe({
          next: () => {
            this.snackBar.open('Rol actualizado ✓', 'Cerrar', { duration: 3000, panelClass: ['snack-success'] });
            this.loadAll();
          },
          error: () => this.snackBar.open('Error al actualizar el rol', 'Cerrar', { duration: 3000, panelClass: ['snack-error'] })
        });
      } else {
        this.roleService.createRole(result).subscribe({
          next: () => {
            this.snackBar.open('Rol creado ✓', 'Cerrar', { duration: 3000, panelClass: ['snack-success'] });
            this.loadAll();
          },
          error: () => this.snackBar.open('Error al crear el rol', 'Cerrar', { duration: 3000, panelClass: ['snack-error'] })
        });
      }
    });
  }

  openPermissions(role: BackendRole): void {
    const ref = this.dialog.open(RolePermissionsDialogComponent, { data: { role }, width: '560px', disableClose: false });
    ref.afterClosed().subscribe((changed) => {
      if (changed) this.loadAll();
    });
  }

  deleteRole(role: BackendRole & { permCount: number }): void {
    if (role.permCount > 0) {
      this.snackBar.open('Primero remueve todos los permisos del rol', 'Cerrar', { duration: 4000, panelClass: ['snack-error'] });
      return;
    }

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Eliminar rol',
        message: `¿Eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.roleService.deleteRole(role.id).subscribe({
        next: () => {
          this.roles.update((l) => l.filter((r) => r.id !== role.id));
          this.snackBar.open('Rol eliminado ✓', 'Cerrar', { duration: 3000, panelClass: ['snack-success'] });
        },
        error: (err) => {
          const msg = err.status === 400 ? 'No se puede eliminar: hay usuarios con este rol asignado' : 'Error al eliminar el rol';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: ['snack-error'] });
        }
      });
    });
  }

  getPermCount(roleId: string): number {
    return this.rolePermissions().get(roleId)?.length ?? 0;
  }

  canReadRolePermissions(): boolean {
    return this.authService.hasPermission('/role-permission/role/?', 'GET') || this.authService.hasRole(UserRole.ADMIN_SISTEMA);
  }
}
