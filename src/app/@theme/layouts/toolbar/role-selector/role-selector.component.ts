import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Subject } from 'rxjs';
import { UserRole, getRoleDisplayLabel } from 'src/app/@theme/types/roles';
import { AuthService } from 'src/app/@theme/services/auth.service';

@Component({
  selector: 'app-role-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="role-selector">
      <button
        mat-button
        [matMenuTriggerFor]="roleMenu"
        class="role-button"
        [title]="'Rol actual: ' + getCurrentRoleLabel()"
      >
        <svg class="pc-icon m-r-10">
          <use xlink:href="assets/fonts/custom-icon.svg#custom-shield"></use>
        </svg>
        <span class="role-label">{{ getCurrentRoleLabel() }}</span>
        <svg class="pc-icon m-l-10">
          <use xlink:href="assets/fonts/custom-icon.svg#custom-chevron-down"></use>
        </svg>
      </button>

      <mat-menu #roleMenu="matMenu" class="role-menu">
        <div mat-menu-item disabled class="role-menu-header">
          <strong>Cambiar Rol</strong>
        </div>
        <mat-divider></mat-divider>

        <ng-container *ngIf="currentUser$ | async as user">
          <button
            mat-menu-item
            *ngFor="let role of user.roles"
            (click)="selectRole(role)"
            [class.active]="isActiveRole(role)"
            class="role-option"
          >
            <svg class="pc-icon m-r-10" [class.hidden]="!isActiveRole(role)">
              <use xlink:href="assets/fonts/custom-icon.svg#custom-check"></use>
            </svg>
            {{ getRoleLabel(role) }}
          </button>
        </ng-container>
      </mat-menu>
    </div>
  `,
  styles: [`
    .role-selector {
      display: flex;
      align-items: center;
    }

    .role-button {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 4px;
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }

    .role-label {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
      font-weight: 500;
    }

    .pc-icon {
      width: 16px;
      height: 16px;
      display: inline-block;

      &.m-r-10 {
        margin-right: 10px;
      }

      &.m-l-10 {
        margin-left: 10px;
      }

      &.hidden {
        visibility: hidden;
      }
    }

    ::ng-deep .role-menu {
      min-width: 250px !important;
    }

    ::ng-deep .role-menu-header {
      padding: 8px 16px;
      font-size: 12px;
      color: #999;
      cursor: default;

      &:hover {
        background-color: transparent !important;
      }
    }

    ::ng-deep .role-option {
      display: flex;
      align-items: center;

      &.active {
        background-color: rgba(33, 150, 243, 0.1);
        color: #2196f3;
      }

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }
  `]
})
export class RoleSelectorComponent implements OnDestroy {
  currentUser$ = this.authService.currentUser$;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentRoleLabel(): string {
    const activeRole = this.authService.getActiveRole();
    return activeRole ? getRoleDisplayLabel(activeRole) : 'Sin rol';
  }

  getRoleLabel(role: UserRole): string {
    return getRoleDisplayLabel(role);
  }

  isActiveRole(role: UserRole): boolean {
    return this.authService.hasActiveRole(role);
  }

  selectRole(role: UserRole): void {
    this.authService.setActiveRole(role);
  }
}
