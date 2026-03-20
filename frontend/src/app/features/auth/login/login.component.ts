import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinner,
  ],
  template: `
    <div class="max-w-md mx-auto px-4 py-12">
      <h1 class="text-2xl font-bold text-center mb-8">Iniciar sesión</h1>

      @if (error) {
        <div class="bg-red-50 text-red-700 px-4 py-3 rounded mb-6">{{ error }}</div>
      }

      <form (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div class="relative">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 !text-[20px]">email</mat-icon>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              placeholder="Email"
              class="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <div class="relative">
            <input
              [type]="hidePassword ? 'password' : 'text'"
              [(ngModel)]="password"
              name="password"
              required
              placeholder="Contraseña"
              class="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            <button type="button" (click)="hidePassword = !hidePassword" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <mat-icon class="!text-[20px]">{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </div>
        </div>

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
