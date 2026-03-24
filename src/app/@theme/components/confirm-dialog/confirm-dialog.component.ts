import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="confirm-dialog">
      <div class="confirm-dialog__icon">
        <mat-icon>warning_amber</mat-icon>
      </div>
      <h3 class="confirm-dialog__title">{{ data.title }}</h3>
      <p class="confirm-dialog__message" [innerHTML]="data.message"></p>
      <p class="confirm-dialog__detail" *ngIf="data.detail">{{ data.detail }}</p>
      <div class="confirm-dialog__actions">
        <button mat-stroked-button (click)="dialogRef.close(false)">Cancelar</button>
        <button mat-flat-button color="warn" (click)="dialogRef.close(true)">
          <mat-icon>delete_outline</mat-icon>
          {{ data.confirmLabel ?? 'Eliminar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 8px 8px 4px;
      text-align: center;
      max-width: 380px;
    }
    .confirm-dialog__icon mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #f57c00;
    }
    .confirm-dialog__title {
      margin: 12px 0 8px;
      font-size: 18px;
      font-weight: 600;
    }
    .confirm-dialog__message {
      color: #555;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 4px;
    }
    .confirm-dialog__detail {
      color: #888;
      font-size: 12px;
      margin-bottom: 20px;
    }
    .confirm-dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 20px;
    }
  `]
})
export class ConfirmDialogComponent {
  dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
}
