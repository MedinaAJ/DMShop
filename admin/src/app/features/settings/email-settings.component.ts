import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../core/services/api.service';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

@Component({
  selector: 'app-email-settings',
  standalone: true,
  imports: [
    FormsModule, MatCardModule, MatSlideToggleModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDividerModule,
  ],
  template: `
    <div class="max-w-3xl">
      <h1 class="text-2xl font-bold mb-6">Configuración de email (SMTP)</h1>

      @if (loading) {
        <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
      } @else {
        <mat-card class="mb-4">
          <mat-card-header>
            <mat-icon mat-card-avatar class="!text-3xl text-gray-600 mt-1">email</mat-icon>
            <mat-card-title>Servidor SMTP</mat-card-title>
            <mat-card-subtitle>Configura el servidor de correo para el envío de emails transaccionales.</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="pt-4 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <mat-form-field class="w-full">
                <mat-label>Host SMTP</mat-label>
                <input matInput [(ngModel)]="config.host" placeholder="smtp.ejemplo.com" />
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Puerto</mat-label>
                <input matInput type="number" [(ngModel)]="config.port" placeholder="465" />
              </mat-form-field>
            </div>

            <mat-slide-toggle [(ngModel)]="config.secure">
              SSL/TLS (recomendado para puerto 465)
            </mat-slide-toggle>

            <mat-divider />

            <div class="grid grid-cols-2 gap-4">
              <mat-form-field class="w-full">
                <mat-label>Usuario SMTP</mat-label>
                <input matInput [(ngModel)]="config.user" placeholder="usuario@ejemplo.com" />
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Contraseña SMTP</mat-label>
                <input matInput type="password" [(ngModel)]="config.pass" placeholder="••••••••" />
              </mat-form-field>
            </div>

            <mat-divider />

            <div class="grid grid-cols-2 gap-4">
              <mat-form-field class="w-full">
                <mat-label>Email remitente</mat-label>
                <input matInput [(ngModel)]="config.fromEmail" placeholder="noreply@tienda.com" />
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Nombre remitente</mat-label>
                <input matInput [(ngModel)]="config.fromName" placeholder="Mi Tienda" />
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Test section -->
        <mat-card class="mb-4">
          <mat-card-header>
            <mat-icon mat-card-avatar class="!text-3xl text-gray-600 mt-1">send</mat-icon>
            <mat-card-title>Probar configuración</mat-card-title>
            <mat-card-subtitle>Envía un email de prueba para verificar que la configuración es correcta.</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="pt-4">
            <div class="flex gap-4 items-end">
              <mat-form-field class="flex-1">
                <mat-label>Enviar email de prueba a</mat-label>
                <input matInput type="email" [(ngModel)]="testEmailAddress" placeholder="admin@ejemplo.com" />
              </mat-form-field>
              <button mat-stroked-button (click)="sendTestEmail()" [disabled]="sendingTest || !testEmailAddress" class="mb-4">
                @if (sendingTest) { <mat-spinner diameter="18" class="inline-block mr-1" /> }
                <mat-icon>send</mat-icon> Probar
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <div class="flex justify-end mt-4">
          <button mat-flat-button color="primary" (click)="save()" [disabled]="saving">
            @if (saving) { <mat-spinner diameter="20" class="inline-block mr-2" /> }
            Guardar configuración
          </button>
        </div>
      }
    </div>
  `,
})
export class EmailSettingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  loading = true;
  saving = false;
  sendingTest = false;
  testEmailAddress = '';

  config: SmtpConfig = {
    host: '',
    port: 465,
    secure: true,
    user: '',
    pass: '',
    fromEmail: 'noreply@dmshop.com',
    fromName: 'DMShop',
  };

  ngOnInit(): void {
    this.api.get<any>('/configurations', { prefix: 'SMTP_' }).subscribe({
      next: (res) => {
        const map = new Map<string, string>(res.data.map((c: any) => [c.key, c.value]));
        this.config.host = map.get('SMTP_HOST') ?? '';
        this.config.port = parseInt(map.get('SMTP_PORT') ?? '465', 10);
        this.config.secure = map.get('SMTP_SECURE') !== 'false';
        this.config.user = map.get('SMTP_USER') ?? '';
        this.config.pass = map.get('SMTP_PASS') ?? '';
        this.config.fromEmail = map.get('SMTP_FROM_EMAIL') ?? 'noreply@dmshop.com';
        this.config.fromName = map.get('SMTP_FROM_NAME') ?? 'DMShop';
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  save(): void {
    this.saving = true;
    const configs = [
      { key: 'SMTP_HOST', value: this.config.host },
      { key: 'SMTP_PORT', value: String(this.config.port) },
      { key: 'SMTP_SECURE', value: this.config.secure ? 'true' : 'false' },
      { key: 'SMTP_USER', value: this.config.user },
      { key: 'SMTP_PASS', value: this.config.pass },
      { key: 'SMTP_FROM_EMAIL', value: this.config.fromEmail },
      { key: 'SMTP_FROM_NAME', value: this.config.fromName },
    ];
    this.api.put('/configurations', { configs }).subscribe({
      next: () => {
        this.snackBar.open('Configuración de email guardada', 'OK', { duration: 3000 });
        this.saving = false;
      },
      error: () => {
        this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 });
        this.saving = false;
      },
    });
  }

  sendTestEmail(): void {
    if (!this.testEmailAddress) return;
    this.sendingTest = true;
    this.api.post<any>('/mail/test', { to: this.testEmailAddress }).subscribe({
      next: () => {
        this.snackBar.open(`Email de prueba enviado a ${this.testEmailAddress}`, 'OK', { duration: 4000 });
        this.sendingTest = false;
      },
      error: (err) => {
        const msg = err?.error?.errors?.[0]?.message ?? 'Error al enviar email de prueba';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        this.sendingTest = false;
      },
    });
  }
}
