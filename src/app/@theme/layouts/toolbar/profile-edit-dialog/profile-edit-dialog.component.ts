import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from 'src/app/@theme/services/auth.service';

/** Valida que si se ingresó nueva contraseña, tenga al menos 6 caracteres */
function newPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value || value.trim() === '') return null; // opcional, no hay error si está vacío
  return value.length >= 6 ? null : { minlength: { requiredLength: 6, actualLength: value.length } };
}

@Component({
  selector: 'app-profile-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>manage_accounts</mat-icon>
      Editar Perfil
    </h2>

    <mat-dialog-content class="dialog-content">
      <form [formGroup]="form">

        <!-- ── Datos personales ── -->
        <p class="section-label">Información personal</p>

        <mat-form-field appearance="outline" class="w-100 m-b-10">
          <mat-label>Nombre completo</mat-label>
          <mat-icon matPrefix>person</mat-icon>
          <input matInput formControlName="name" placeholder="Tu nombre" />
          <mat-error *ngIf="form.get('name')?.hasError('required')">El nombre es requerido</mat-error>
          <mat-error *ngIf="form.get('name')?.hasError('minlength')">Mínimo 2 caracteres</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Correo electrónico</mat-label>
          <mat-icon matPrefix>email</mat-icon>
          <input matInput formControlName="email" placeholder="tu@correo.com" />
          <mat-error *ngIf="form.get('email')?.hasError('required')">El correo es requerido</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Correo inválido</mat-error>
        </mat-form-field>

        <mat-divider class="divider"></mat-divider>

        <!-- ── Seguridad ── -->
        <p class="section-label">Seguridad</p>

        <!-- Contraseña actual (siempre requerida) -->
        <mat-form-field appearance="outline" class="w-100 m-b-10">
          <mat-label>Contraseña actual</mat-label>
          <mat-icon matPrefix>lock</mat-icon>
          <input matInput
                 [type]="showCurrent() ? 'text' : 'password'"
                 formControlName="currentPassword"
                 placeholder="Ingresa tu contraseña actual" />
          <button mat-icon-button matSuffix type="button" (click)="showCurrent.set(!showCurrent())">
            <mat-icon>{{ showCurrent() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-hint>Requerida para confirmar cualquier cambio</mat-hint>
          <mat-error *ngIf="form.get('currentPassword')?.hasError('required')">La contraseña actual es requerida</mat-error>
          <mat-error *ngIf="form.get('currentPassword')?.hasError('minlength')">Mínimo 6 caracteres</mat-error>
        </mat-form-field>

        <!-- Nueva contraseña (opcional) -->
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Nueva contraseña <span class="optional">(opcional)</span></mat-label>
          <mat-icon matPrefix>lock_reset</mat-icon>
          <input matInput
                 [type]="showNew() ? 'text' : 'password'"
                 formControlName="newPassword"
                 placeholder="Déjala en blanco para no cambiarla" />
          <button mat-icon-button matSuffix type="button" (click)="showNew.set(!showNew())">
            <mat-icon>{{ showNew() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-hint *ngIf="!form.get('newPassword')?.value">Si no la cambias, se mantiene la actual</mat-hint>
          <mat-error *ngIf="form.get('newPassword')?.hasError('minlength')">Mínimo 6 caracteres</mat-error>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()" [disabled]="saving()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        (click)="save()"
        [disabled]="form.invalid || saving()"
      >
        <mat-spinner *ngIf="saving()" diameter="18" class="btn-spinner"></mat-spinner>
        <span *ngIf="!saving()">Guardar cambios</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title    { display: flex; align-items: center; gap: 8px; }
    .dialog-content  { min-width: 400px; padding-top: 8px; }
    .w-100           { width: 100%; }
    .m-b-10          { margin-bottom: 10px; }
    .section-label   { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase;
                       letter-spacing: 0.5px; margin: 4px 0 12px; }
    .divider         { margin: 16px 0 12px; }
    .optional        { font-weight: 400; font-size: 11px; color: #999; }
    .btn-spinner     { display: inline-block; }
    mat-icon[matPrefix] { margin-right: 4px; font-size: 20px; }
  `]
})
export class ProfileEditDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ProfileEditDialogComponent>);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  saving = signal(false);
  showCurrent = signal(false);
  showNew = signal(false);

  form = this.fb.group({
    name:            ['', [Validators.required, Validators.minLength(2)]],
    email:           ['', [Validators.required, Validators.email]],
    currentPassword: ['', [Validators.required, Validators.minLength(6)]],
    newPassword:     ['', [newPasswordValidator]]   // opcional
  });

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.form.patchValue({ name: user.name, email: user.email });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const { name, email, currentPassword, newPassword } = this.form.value;

    // Si hay nueva contraseña la usamos; si no, mandamos la actual para que el backend no explote
    const passwordToSend = (newPassword && newPassword.trim() !== '') ? newPassword : currentPassword;

    this.saving.set(true);
    this.authService.updateProfile(name!, email!, passwordToSend!).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Perfil actualizado correctamente ✓', 'Cerrar', {
          duration: 3000,
          panelClass: ['snack-success'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err.status === 409
          ? 'Ese correo ya está en uso por otro usuario'
          : err.status === 401
          ? 'Contraseña actual incorrecta'
          : 'Error al actualizar el perfil';
        this.snackBar.open(msg, 'Cerrar', {
          duration: 4000,
          panelClass: ['snack-error'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
