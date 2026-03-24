import { Component, inject, signal, computed, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { lastValueFrom } from 'rxjs';

import { SharedModule } from 'src/app/demo/shared/shared.module';
import { RoleService, BackendPermission } from 'src/app/@theme/services/role.service';
import { HasPermissionDirective } from 'src/app/@theme/directives/has-permission.directive';
import { ConfirmDialogComponent } from 'src/app/@theme/components/confirm-dialog/confirm-dialog.component';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

// ── Dialog: Crear / Editar Permiso ──────────────────────────────────────────
@Component({
  selector: 'app-permission-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
            MatFormFieldModule, MatInputModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>{{ data ? 'edit' : 'add_circle' }}</mat-icon>
      {{ data ? 'Editar Permiso' : 'Nuevo Permiso' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-content">

        <mat-form-field appearance="outline" class="w-100 m-b-12">
          <mat-label>URL del endpoint</mat-label>
          <mat-icon matPrefix>link</mat-icon>
          <input matInput formControlName="url" placeholder="Ej: /api/users" />
          <mat-hint>Ruta del endpoint protegido</mat-hint>
          <mat-error *ngIf="form.get('url')?.hasError('required')">La URL es requerida</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100 m-b-12">
          <mat-label>Método HTTP</mat-label>
          <mat-icon matPrefix>http</mat-icon>
          <mat-select formControlName="method">
            <mat-option *ngFor="let m of methods" [value]="m">
              <span class="method-opt" [ngClass]="methodClass(m)">{{ m }}</span>
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('method')?.hasError('required')">El método es requerido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Módulo / Modelo</mat-label>
          <mat-icon matPrefix>category</mat-icon>
          <input matInput formControlName="model" placeholder="Ej: usuarios, buses, rutas" />
          <mat-hint>Módulo al que pertenece este endpoint</mat-hint>
          <mat-error *ngIf="form.get('model')?.hasError('required')">El módulo es requerido</mat-error>
        </mat-form-field>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancelar</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="form.invalid">
        {{ data ? 'Guardar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title { display:flex;align-items:center;gap:8px; }
    .form-content { padding-top:8px;min-width:400px; }
    .w-100 { width:100%; }
    .m-b-12 { margin-bottom:12px; }
    .method-opt { font-weight:700;padding:2px 6px;border-radius:4px; }
    .method-get    { background:#e3f2fd;color:#1565c0; }
    .method-post   { background:#e8f5e9;color:#2e7d32; }
    .method-put    { background:#fff3e0;color:#e65100; }
    .method-delete { background:#fce4ec;color:#c62828; }
    .method-patch  { background:#f3e5f5;color:#6a1b9a; }
  `]
})
export class PermissionFormDialogComponent {
  private fb = inject(FormBuilder);
  methods = HTTP_METHODS;

  form = this.fb.group({
    url:    [this.data?.url    ?? '', Validators.required],
    method: [this.data?.method ?? '', Validators.required],
    model:  [this.data?.model  ?? '', Validators.required]
  });

  constructor(
    public dialogRef: MatDialogRef<PermissionFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BackendPermission | null
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value);
  }

  methodClass(m: string): string {
    return { GET:'method-get', POST:'method-post', PUT:'method-put', DELETE:'method-delete', PATCH:'method-patch' }[m] ?? '';
  }
}

// ── Componente Principal: Gestión de Permisos ────────────────────────────────
@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [
    CommonModule, FormsModule, SharedModule,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule, MatDialogModule,
    HasPermissionDirective, ConfirmDialogComponent
  ],
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss']
})
export default class PermissionsComponent implements OnInit {
  private roleService = inject(RoleService);
  private snackBar    = inject(MatSnackBar);
  private dialog      = inject(MatDialog);

  displayedColumns = ['method', 'url', 'model', 'actions'];

  permissions  = signal<BackendPermission[]>([]);
  filtered     = signal<BackendPermission[]>([]);
  loading      = signal(false);
  errorMessage = signal('');
  searchQuery  = '';

  ngOnInit(): void {
    this.loadPermissions();
  }

  async loadPermissions(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const perms = await lastValueFrom(this.roleService.getPermissions());
      this.permissions.set(perms);
      this.filtered.set(perms);
      this.loading.set(false);
    } catch {
      this.loading.set(false);
      this.errorMessage.set('Error al cargar los permisos');
    }
  }

  onSearch(query: string): void {
    const q = query.toLowerCase().trim();
    if (!q) {
      this.filtered.set(this.permissions());
      return;
    }
    this.filtered.set(
      this.permissions().filter(p =>
        p.url?.toLowerCase().includes(q) ||
        p.method?.toLowerCase().includes(q) ||
        p.model?.toLowerCase().includes(q)
      )
    );
  }

  openPermissionForm(perm: BackendPermission | null = null): void {
    const ref = this.dialog.open(PermissionFormDialogComponent, { data: perm, width: '460px' });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      if (perm) {
        this.roleService.updatePermission(perm.id, result).subscribe({
          next: () => { this.snackBar.open('Permiso actualizado ✓', 'Cerrar', { duration: 3000, panelClass: ['snack-success'] }); this.loadPermissions(); },
          error: () => this.snackBar.open('Error al actualizar el permiso', 'Cerrar', { duration: 3000, panelClass: ['snack-error'] })
        });
      } else {
        this.roleService.createPermission(result).subscribe({
          next: () => { this.snackBar.open('Permiso creado ✓', 'Cerrar', { duration: 3000, panelClass: ['snack-success'] }); this.loadPermissions(); },
          error: () => this.snackBar.open('Error al crear el permiso', 'Cerrar', { duration: 3000, panelClass: ['snack-error'] })
        });
      }
    });
  }

  deletePermission(perm: BackendPermission): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar permiso',
        message: `¿Estás seguro de que deseas eliminar el permiso <strong>${perm.method} ${perm.url}</strong>?`,
        detail: 'Esta acción no se puede deshacer.'
      },
      width: '420px'
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.roleService.deletePermission(perm.id).subscribe({
        next: () => {
          this.permissions.update(l => l.filter(p => p.id !== perm.id));
          this.filtered.update(l => l.filter(p => p.id !== perm.id));
          this.snackBar.open('Permiso eliminado ✓', 'Cerrar', { duration: 3000, panelClass: ['snack-success'] });
        },
        error: () => this.snackBar.open('Error al eliminar el permiso', 'Cerrar', { duration: 3000, panelClass: ['snack-error'] })
      });
    });
  }

  methodClass(method: string): string {
    return { GET:'badge-get', POST:'badge-post', PUT:'badge-put', DELETE:'badge-delete', PATCH:'badge-patch' }[method] ?? '';
  }
}
