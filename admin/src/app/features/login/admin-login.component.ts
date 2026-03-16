import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <mat-card class="w-full max-w-md">
        <mat-card-header class="justify-center mb-6">
          <mat-card-title class="!text-2xl">DMShop Admin</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (error) {
            <div class="bg-red-50 text-red-700 px-4 py-3 rounded mb-4">{{ error }}</div>
          }
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" required />
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Contraseña</mat-label>
              <input
                matInput
                [type]="hidePassword ? 'password' : 'text'"
                [(ngModel)]="password"
                name="password"
                required
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hidePassword = !hidePassword"
              >
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="loading"
              class="w-full !py-3"
            >
              @if (loading) {
                <mat-spinner diameter="20" class="inline-block" />
              } @else {
                Iniciar sesión
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class AdminLoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  hidePassword = true;
  loading = false;
  error = '';

  async onSubmit(): Promise<void> {
    this.error = '';
    this.loading = true;
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error = err?.message || err?.error?.errors?.[0]?.message || 'Credenciales incorrectas';
    } finally {
      this.loading = false;
    }
  }
}
