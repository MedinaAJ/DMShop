import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="max-w-md mx-auto px-4 py-12">
      <h1 class="text-2xl font-bold text-center mb-8">Iniciar sesión</h1>

      @if (error) {
        <div class="bg-red-50 text-red-700 px-4 py-3 rounded mb-6">{{ error }}</div>
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
          <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
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

      <p class="text-center mt-6 text-gray-500">
        ¿No tienes cuenta?
        <a routerLink="/auth/register" class="text-blue-600 hover:underline">Regístrate</a>
      </p>
    </div>
  `,
})
export class LoginComponent {
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
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err?.error?.errors?.[0]?.message || 'Credenciales incorrectas';
    } finally {
      this.loading = false;
    }
  }
}
