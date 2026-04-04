import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';

import { SharedModule } from 'src/app/demo/shared/shared.module';
import { AuthService, TwoFactorChallenge } from 'src/app/@theme/services/auth.service';

@Component({
  selector: 'app-two-factor',
  imports: [SharedModule, RouterModule],
  templateUrl: './two-factor.component.html',
  styleUrls: ['./two-factor.component.scss', '../authentication.scss']
})
export default class TwoFactorComponent implements OnInit, OnDestroy {
  code = '';
  loading = false;
  resendLoading = false;
  warningMessage = '';
  infoMessage = '';

  maskedEmail = '';
  challengeToken = '';
  remainingAttempts = 3;
  expiresAt = 0;
  secondsLeft = 0;

  private countdownSub?: Subscription;
  private authCompleted = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    const challenge = this.authService.getPendingTwoFactorChallenge();
    if (!challenge) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.applyChallenge(challenge);
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.countdownSub?.unsubscribe();
    if (!this.authCompleted && this.challengeToken) {
      this.authService.cancelPendingTwoFactorChallenge().subscribe();
    }
  }

  @HostListener('window:beforeunload')
  onWindowBeforeUnload(): void {
    if (!this.authCompleted && this.challengeToken) {
      this.authService.cancelPendingTwoFactorChallengeWithBeacon(this.challengeToken);
    }
  }

  get canResend(): boolean {
    return this.secondsLeft <= 0 && !this.resendLoading;
  }

  get formattedTime(): string {
    const minutes = Math.floor(this.secondsLeft / 60);
    const seconds = this.secondsLeft % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  onCodeInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.code = this.sanitizeCode(target.value);
    target.value = this.code;
  }

  onCodePaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') ?? '';
    const cleanedCode = this.sanitizeCode(pastedText);
    if (!cleanedCode) {
      return;
    }
    event.preventDefault();
    this.code = cleanedCode;
  }

  submitCode(): void {
    if (this.code.length !== 6 || this.loading) {
      return;
    }

    this.loading = true;
    this.warningMessage = '';
    this.infoMessage = '';
    this.cdr.markForCheck();

    this.authService.verifyTwoFactorCode(this.challengeToken, this.code).subscribe({
      next: () => {
        this.authCompleted = true;
        this.loading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/dashboard']);
      },
      error: (error: unknown) => {
        this.loading = false;
        this.code = '';

        if (error instanceof HttpErrorResponse && error.status === 401) {
          const attemptsLeft = Number((error.error as { attemptsLeft?: number } | null)?.attemptsLeft ?? this.remainingAttempts);
          this.remainingAttempts = Math.max(0, attemptsLeft);

          if (this.remainingAttempts <= 0) {
            this.warningMessage = 'Codigo incorrecto. Se agotaron los intentos permitidos.';
            this.authService.clearPendingTwoFactorChallenge();
            this.cdr.markForCheck();
            setTimeout(() => this.router.navigate(['/auth/login']), 1200);
            return;
          }

          this.warningMessage = `Codigo incorrecto. Te quedan ${this.remainingAttempts} intentos.`;
        } else if (error instanceof HttpErrorResponse && error.status === 400) {
          this.warningMessage = 'El código expiró o la sesión 2FA es inválida. Solicita uno nuevo.';
        } else {
          this.warningMessage = 'No fue posible validar el código. Intenta de nuevo.';
        }

        this.cdr.markForCheck();
      }
    });
  }

  resendCode(): void {
    if (!this.canResend) {
      return;
    }

    this.resendLoading = true;
    this.warningMessage = '';
    this.infoMessage = '';
    this.cdr.markForCheck();

    this.authService.resendTwoFactorCode(this.challengeToken).subscribe({
      next: (challenge) => {
        this.applyChallenge(challenge);
        this.startCountdown();
        this.infoMessage = 'Se envio un nuevo código a tu correo. Revisa también spam.';
        this.resendLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.resendLoading = false;

        if (error instanceof HttpErrorResponse && error.status === 429) {
          const waitSeconds = Number((error.error as { secondsLeft?: number } | null)?.secondsLeft ?? 0);
          this.secondsLeft = Math.max(waitSeconds, 0);
          this.warningMessage = 'Aún no puedes reenviar. Espera a que termine el contador.';
        } else if (error instanceof HttpErrorResponse && error.status === 401) {
          this.warningMessage = 'Se agotaron los intentos. Debes iniciar sesión nuevamente.';
          this.authService.clearPendingTwoFactorChallenge();
          this.cdr.markForCheck();
          setTimeout(() => this.router.navigate(['/auth/login']), 1200);
          return;
        } else {
          this.warningMessage = 'No fue posible reenviar el código. Intenta de nuevo.';
        }

        this.cdr.markForCheck();
      }
    });
  }

  cancelAndBackToLogin(): void {
    this.authService.cancelPendingTwoFactorChallenge().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }

  private applyChallenge(challenge: TwoFactorChallenge): void {
    this.challengeToken = challenge.challengeToken;
    this.maskedEmail = challenge.maskedEmail;
    this.expiresAt = challenge.expiresAt;
    this.remainingAttempts = challenge.remainingAttempts;
    this.code = '';
  }

  private startCountdown(): void {
    this.countdownSub?.unsubscribe();
    this.updateSecondsLeft();

    this.countdownSub = interval(1000).subscribe(() => {
      this.updateSecondsLeft();
      this.cdr.markForCheck();
    });
  }

  private updateSecondsLeft(): void {
    const diff = Math.floor((this.expiresAt - Date.now()) / 1000);
    this.secondsLeft = Math.max(0, diff);
  }

  private sanitizeCode(value: string): string {
    return value.replace(/\D/g, '').slice(0, 6);
  }
}
