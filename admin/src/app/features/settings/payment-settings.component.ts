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

interface PaymentConfig {
  bankTransferEnabled: boolean;
  cashOnDeliveryEnabled: boolean;
  stripeEnabled: boolean;
  stripePublicKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
}

@Component({
  selector: 'app-payment-settings',
  standalone: true,
  imports: [
    FormsModule, MatCardModule, MatSlideToggleModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDividerModule,
  ],
  template: `
    <div class="max-w-3xl">
      <h1 class="text-2xl font-bold mb-6">Configuración de pagos</h1>

      @if (loading) {
        <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
      } @else {
        <!-- Bank transfer -->
        <mat-card class="mb-4">
          <mat-card-header>
            <mat-icon mat-card-avatar class="!text-3xl text-gray-600 mt-1">account_balance</mat-icon>
            <mat-card-title>Transferencia bancaria</mat-card-title>
            <mat-card-subtitle>Los clientes pagan mediante transferencia y el admin confirma manualmente.</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="pt-4">
            <mat-slide-toggle [(ngModel)]="config.bankTransferEnabled">
              Habilitado
            </mat-slide-toggle>
          </mat-card-content>
        </mat-card>

        <!-- Cash on delivery -->
        <mat-card class="mb-4">
          <mat-card-header>
            <mat-icon mat-card-avatar class="!text-3xl text-gray-600 mt-1">payments</mat-icon>
            <mat-card-title>Contra reembolso</mat-card-title>
            <mat-card-subtitle>El cliente paga al recibir el pedido.</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="pt-4">
            <mat-slide-toggle [(ngModel)]="config.cashOnDeliveryEnabled">
              Habilitado
            </mat-slide-toggle>
          </mat-card-content>
        </mat-card>

        <!-- Stripe -->
        <mat-card class="mb-4">
          <mat-card-header>
            <mat-icon mat-card-avatar class="!text-3xl text-gray-600 mt-1">credit_card</mat-icon>
            <mat-card-title>Stripe</mat-card-title>
            <mat-card-subtitle>Pagos con tarjeta de crédito/débito a través de Stripe Checkout.</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="pt-4 space-y-4">
            <mat-slide-toggle [(ngModel)]="config.stripeEnabled">
              Habilitado
            </mat-slide-toggle>

            @if (config.stripeEnabled) {
              <mat-form-field class="w-full">
                <mat-label>Public Key (pk_...)</mat-label>
                <input matInput [(ngModel)]="config.stripePublicKey" placeholder="pk_test_..." />
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Secret Key (sk_...)</mat-label>
                <input matInput [(ngModel)]="config.stripeSecretKey" type="password" placeholder="sk_test_..." />
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Webhook Secret (whsec_...)</mat-label>
                <input matInput [(ngModel)]="config.stripeWebhookSecret" type="password" placeholder="whsec_..." />
              </mat-form-field>
            }
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
export class PaymentSettingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  loading = true;
  saving = false;

  config: PaymentConfig = {
    bankTransferEnabled: true,
    cashOnDeliveryEnabled: true,
    stripeEnabled: false,
    stripePublicKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
  };

  private readonly KEY_MAP: Record<keyof PaymentConfig, string> = {
    bankTransferEnabled: 'PAYMENT_BANK_TRANSFER_ENABLED',
    cashOnDeliveryEnabled: 'PAYMENT_CASH_ON_DELIVERY_ENABLED',
    stripeEnabled: 'PAYMENT_STRIPE_ENABLED',
    stripePublicKey: 'STRIPE_PUBLIC_KEY',
    stripeSecretKey: 'STRIPE_SECRET_KEY',
    stripeWebhookSecret: 'STRIPE_WEBHOOK_SECRET',
  };

  ngOnInit(): void {
    this.api.get<any>('/configurations', { prefix: 'PAYMENT_,STRIPE_' }).subscribe({
      next: (res) => {
        const map = new Map<string, string>();
        for (const c of res.data) map.set(c.key, c.value);
        this.config.bankTransferEnabled = map.get('PAYMENT_BANK_TRANSFER_ENABLED') !== '0';
        this.config.cashOnDeliveryEnabled = map.get('PAYMENT_CASH_ON_DELIVERY_ENABLED') !== '0';
        this.config.stripeEnabled = map.get('PAYMENT_STRIPE_ENABLED') === '1';
        this.config.stripePublicKey = map.get('STRIPE_PUBLIC_KEY') ?? '';
        this.config.stripeSecretKey = map.get('STRIPE_SECRET_KEY') ?? '';
        this.config.stripeWebhookSecret = map.get('STRIPE_WEBHOOK_SECRET') ?? '';
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  save(): void {
    this.saving = true;
    const configs = [
      { key: 'PAYMENT_BANK_TRANSFER_ENABLED', value: this.config.bankTransferEnabled ? '1' : '0' },
      { key: 'PAYMENT_CASH_ON_DELIVERY_ENABLED', value: this.config.cashOnDeliveryEnabled ? '1' : '0' },
      { key: 'PAYMENT_STRIPE_ENABLED', value: this.config.stripeEnabled ? '1' : '0' },
      { key: 'STRIPE_PUBLIC_KEY', value: this.config.stripePublicKey },
      { key: 'STRIPE_SECRET_KEY', value: this.config.stripeSecretKey },
      { key: 'STRIPE_WEBHOOK_SECRET', value: this.config.stripeWebhookSecret },
    ];
    this.api.put('/configurations', { configs }).subscribe({
      next: () => {
        this.snackBar.open('Configuración guardada', 'OK', { duration: 3000 });
        this.saving = false;
      },
      error: () => {
        this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 });
        this.saving = false;
      },
    });
  }
}
