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

function passwordValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;

  const valid = value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

  return valid ? null : { passwordPolicy: true };
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
      <form [formGroup]="form" class="profile-form">
        <p class="section-label">Información personal</p>

        <mat-form-field appearance="outline" class="w-100 m-b-10">
          <mat-label>Nombre completo</mat-label>
          <mat-icon matPrefix>person</mat-icon>
          <input matInput formControlName="name" placeholder="Tu nombre" />
          <mat-error *ngIf="form.get('name')?.hasError('required')">El nombre es requerido</mat-error>
          <mat-error *ngIf="form.get('name')?.hasError('minlength')">Mínimo 2 caracteres</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Correo nuevo</mat-label>
          <mat-icon matPrefix>email</mat-icon>
          <input matInput formControlName="email" placeholder="tu@correo.com" />
          <mat-hint *ngIf="currentUser?.authProvider && !unlinkMode()">
            Este es el correo de la cuenta social vinculada actualmente.
          </mat-hint>
          <mat-error *ngIf="form.get('email')?.hasError('required')">El correo es requerido</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Correo inválido</mat-error>
        </mat-form-field>

        <div class="unlink-card" *ngIf="currentUser?.authProvider">
          <div>
            <p class="unlink-title">Cuenta vinculada</p>
            <p class="unlink-copy">
              Tu sesión actual viene de {{ getProviderLabel(currentUser?.authProvider) }}. Si la desvinculas, podrás entrar con correo y
              contraseña.
            </p>
          </div>
          <button mat-stroked-button color="warn" type="button" (click)="toggleUnlinkMode()" [disabled]="saving()">
            {{ unlinkMode() ? 'Cancelar' : 'Desvincular cuenta' }}
          </button>
        </div>

        <mat-divider class="divider"></mat-divider>

        <p class="section-label">Contraseña</p>

        <mat-form-field appearance="outline" class="w-100">
          <mat-label>{{ unlinkMode() ? 'Nueva contraseña' : 'Contraseña' }}</mat-label>
          <mat-icon matPrefix>lock</mat-icon>
          <input
            matInput
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="password"
            [placeholder]="unlinkMode() ? 'Necesaria para desvincular la cuenta' : 'Déjala en blanco para mantenerla'"
          />
          <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())">
            <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-hint>
            {{ unlinkMode() ? 'La contraseña es obligatoria para desvincular la cuenta social.' : 'Opcional si no quieres cambiarla.' }}
          </mat-hint>
          <mat-error *ngIf="form.get('password')?.hasError('required')">La contraseña es requerida para desvincular</mat-error>
          <mat-error *ngIf="form.get('password')?.hasError('passwordPolicy')"
            >Debe tener 8 caracteres, una mayúscula, un número y un carácter especial</mat-error
          >
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()" [disabled]="saving()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="!canSubmit() || saving()">
        <mat-spinner *ngIf="saving()" diameter="18" class="btn-spinner"></mat-spinner>
        <span *ngIf="!saving()">{{ unlinkMode() ? 'Desvincular y guardar' : 'Guardar cambios' }}</span>
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
      .dialog-content {
        min-width: 420px;
        padding-top: 8px;
      }
      .profile-form {
        display: block;
      }
      .w-100 {
        width: 100%;
      }
      .m-b-10 {
        margin-bottom: 10px;
      }
      .section-label {
        font-size: 12px;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 4px 0 12px;
      }
      .divider {
        margin: 16px 0 12px;
      }
      .btn-spinner {
        display: inline-block;
      }
      .unlink-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 14px;
        background: #fafafa;
        margin-top: 12px;
      }
      .unlink-title {
        margin: 0 0 4px;
        font-weight: 700;
        font-size: 14px;
      }
      .unlink-copy {
        margin: 0;
        color: #666;
        font-size: 13px;
        line-height: 1.35;
      }
      mat-icon[matPrefix] {
        margin-right: 4px;
        font-size: 20px;
      }
    `
  ]
})
export class ProfileEditDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ProfileEditDialogComponent>);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  currentUser = this.authService.getCurrentUser();
  saving = signal(false);
  unlinkMode = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [passwordValidator]]
  });

  ngOnInit(): void {
    if (this.currentUser) {
      this.form.patchValue({
        name: this.currentUser.name,
        email: this.currentUser.email
      });
    }
  }

  toggleUnlinkMode(): void {
    this.unlinkMode.update((value) => !value);
    const passwordControl = this.form.get('password');

    if (this.unlinkMode()) {
      passwordControl?.setValidators([Validators.required, passwordValidator]);
      if (this.currentUser?.email) {
        this.form.patchValue({ email: this.currentUser.email });
      }
    } else {
      passwordControl?.setValidators([passwordValidator]);
      passwordControl?.setValue('');
    }

    passwordControl?.updateValueAndValidity();
  }

  canSubmit(): boolean {
    if (!this.form.valid) {
      return false;
    }

    if (this.unlinkMode()) {
      const password = String(this.form.get('password')?.value ?? '').trim();
      return password.length > 0;
    }

    return true;
  }

  save(): void {
    if (!this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.form.value;
    const passwordToSend = String(password ?? '').trim();

    this.saving.set(true);
    this.authService.updateProfile(name!, email!, passwordToSend, this.unlinkMode()).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(this.unlinkMode() ? 'Cuenta desvinculada correctamente' : 'Perfil actualizado correctamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['snack-success'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving.set(false);
        const backendMessage = (err.error as { error?: string } | null)?.error;
        const msg = backendMessage ?? (err.status === 409 ? 'Revisa el correo o la contraseña ingresada' : 'Error al actualizar el perfil');

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

  getProviderLabel(provider?: string | null): string {
    const labels: Record<string, string> = {
      'google.com': 'Google',
      'github.com': 'GitHub',
      'microsoft.com': 'Microsoft'
    };

    return provider ? (labels[provider] ?? provider) : 'cuenta social';
  }
}
