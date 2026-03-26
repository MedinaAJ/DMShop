import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  template: `
    <h2 class="text-xl font-semibold mb-4">Mi perfil</h2>

    <!-- Profile form -->
    <mat-card class="mb-6">
      <mat-card-header>
        <mat-icon mat-card-avatar class="!text-blue-600">person</mat-icon>
        <mat-card-title>Datos personales</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="grid md:grid-cols-2 gap-4 mt-4">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="firstName" />
            @if (profileForm.get('firstName')?.invalid && profileForm.get('firstName')?.touched) {
              <mat-error>El nombre es obligatorio</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Apellidos</mat-label>
            <input matInput formControlName="lastName" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="md:col-span-2">
            <mat-label>Email</mat-label>
            <mat-icon matPrefix>email</mat-icon>
            <input matInput type="email" formControlName="email" />
            @if (profileForm.get('email')?.invalid && profileForm.get('email')?.touched) {
              <mat-error>Email inválido</mat-error>
            }
          </mat-form-field>

          <div class="md:col-span-2 flex justify-end">
            <button mat-flat-button color="primary" type="submit" [disabled]="savingProfile()">
              @if (savingProfile()) {
                <mat-spinner diameter="20" class="mr-2" />
              }
              Guardar cambios
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- Password change -->
    <mat-card>
      <mat-card-header>
        <mat-icon mat-card-avatar class="!text-blue-600">lock</mat-icon>
        <mat-card-title>Cambiar contraseña</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="passwordForm" (ngSubmit)="savePassword()" class="flex flex-col gap-4 mt-4 max-w-md">
          <mat-form-field appearance="outline">
            <mat-label>Contraseña actual</mat-label>
            <input matInput type="password" formControlName="currentPassword" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nueva contraseña</mat-label>
            <input matInput type="password" formControlName="newPassword" />
            @if (passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched) {
              <mat-error>Mínimo 8 caracteres</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Confirmar nueva contraseña</mat-label>
            <input matInput type="password" formControlName="confirmPassword" />
            @if (passwordForm.hasError('mismatch') && passwordForm.get('confirmPassword')?.touched) {
              <mat-error>Las contraseñas no coinciden</mat-error>
            }
          </mat-form-field>

          <div class="flex justify-end">
            <button mat-flat-button color="primary" type="submit" [disabled]="savingPassword()">
              Cambiar contraseña
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
})
export class ProfileComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);

  readonly profileForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
  });

  readonly passwordForm = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: (g) => {
      const np = g.get('newPassword')?.value;
      const cp = g.get('confirmPassword')?.value;
      return np === cp ? null : { mismatch: true };
    }},
  );

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    }
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true);
    try {
      const { firstName, lastName, email } = this.profileForm.value;
      await firstValueFrom(
        this.api.put<{ success: boolean }>('/users/me', { firstName, lastName, email }),
      );
      this.snackBar.open('Perfil actualizado', 'OK', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(err?.error?.message ?? 'Error al guardar el perfil', 'OK', { duration: 4000 });
    } finally {
      this.savingProfile.set(false);
    }
  }

  async savePassword(): Promise<void> {
    if (this.passwordForm.invalid) return;
    this.savingPassword.set(true);
    try {
      const { currentPassword, newPassword } = this.passwordForm.value;
      await firstValueFrom(
        this.api.put<{ success: boolean }>('/users/me/password', {
          currentPassword,
          newPassword,
        }),
      );
      this.passwordForm.reset();
      this.snackBar.open('Contraseña actualizada', 'OK', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(err?.error?.message ?? 'Error al cambiar la contraseña', 'OK', { duration: 4000 });
    } finally {
      this.savingPassword.set(false);
    }
  }
}
