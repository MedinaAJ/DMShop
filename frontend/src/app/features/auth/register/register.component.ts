import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="max-w-md mx-auto px-4 py-12">
      <h1 class="text-2xl font-bold text-center mb-8">Crear cuenta</h1>

      @if (error) {
        <div class="bg-red-50 text-red-700 px-4 py-3 rounded mb-6">{{ error }}</div>
      }

      <form (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput [(ngModel)]="firstName" name="firstName" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Apellidos</mat-label>
            <input matInput [(ngModel)]="lastName" name="lastName" required />
          </mat-form-field>
        </div>

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
            minlength="8"
          />
          <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
            <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-hint>Mínimo 8 caracteres</mat-hint>
        </mat-form-field>

        <mat-checkbox [(ngModel)]="newsletter" name="newsletter" color="primary">
          Suscribirme al boletín
        </mat-checkbox>

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
            Crear cuenta
          }
        </button>
      </form>

      <p class="text-center mt-6 text-gray-500">
        ¿Ya tienes cuenta?
        <a routerLink="/auth/login" class="text-blue-600 hover:underline">Inicia sesión</a>
      </p>
    </div>
  `,
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  newsletter = false;
  hidePassword = true;
  loading = false;
  error = '';

  async onSubmit(): Promise<void> {
    this.error = '';
    this.loading = true;
    try {
      await this.authService.register({
        email: this.email,
        password: this.password,
        firstName: this.firstName,
        lastName: this.lastName,
        newsletter: this.newsletter,
      });
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err?.error?.errors?.[0]?.message || 'Error al crear la cuenta';
    } finally {
      this.loading = false;
    }
  }
}
