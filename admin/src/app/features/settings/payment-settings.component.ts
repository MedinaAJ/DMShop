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
  // Cash on delivery extras
  codSurchargeAmount: string;
  codAllowedCountries: string;
  codAllowedGroups: string;
  // Bank transfer extras
  bankTransferAllowedCountries: string;
  bankTransferAllowedGroups: string;
  // Redsys
  redsysEnabled: boolean;
  redsysMerchantCode: string;
  redsysTerminal: string;
  redsysSecretKey: string;
  redsysAllowedCountries: string;
  redsysAllowedGroups: string;
  // Bizum (shares Redsys credentials)
  bizumEnabled: boolean;
  bizumAllowedGroups: string;
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
          <mat-card-content class="pt-4 space-y-4">
            <mat-slide-toggle [(ngModel)]="config.bankTransferEnabled">
              Habilitado
            </mat-slide-toggle>
            @if (config.bankTransferEnabled) {
              <mat-form-field class="w-full">
                <mat-label>Países permitidos (códigos ISO separados por coma)</mat-label>
                <input matInput [(ngModel)]="config.bankTransferAllowedCountries" placeholder="ES, PT, FR" />
                <mat-hint>Deja vacío para permitir en todos los países.</mat-hint>
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Grupos de clientes permitidos (IDs separados por coma)</mat-label>
                <input matInput [(ngModel)]="config.bankTransferAllowedGroups" placeholder="1, 2, 3" />
                <mat-hint>Deja vacío para permitir a todos los grupos.</mat-hint>
              </mat-form-field>
            }
          </mat-card-content>
        </mat-card>

        <!-- Cash on delivery -->
        <mat-card class="mb-4">
          <mat-card-header>
            <mat-icon mat-card-avatar class="!text-3xl text-gray-600 mt-1">payments</mat-icon>
            <mat-card-title>Contra reembolso</mat-card-title>
            <mat-card-subtitle>El cliente paga al recibir el pedido.</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="pt-4 space-y-4">
            <mat-slide-toggle [(ngModel)]="config.cashOnDeliveryEnabled">
              Habilitado
            </mat-slide-toggle>
            @if (config.cashOnDeliveryEnabled) {
              <mat-form-field class="w-full">
                <mat-label>Recargo fijo (€) — deja 0 para sin recargo</mat-label>
                <input matInput type="number" [(ngModel)]="config.codSurchargeAmount" min="0" step="0.01" placeholder="0.00" />
                <mat-hint>Importe adicional que se sumará al total del pedido.</mat-hint>
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Países permitidos (códigos ISO separados por coma)</mat-label>
                <input matInput [(ngModel)]="config.codAllowedCountries" placeholder="ES, PT, FR" />
                <mat-hint>Deja vacío para permitir en todos los países.</mat-hint>
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Grupos de clientes permitidos (IDs separados por coma)</mat-label>
                <input matInput [(ngModel)]="config.codAllowedGroups" placeholder="1, 2, 3" />
                <mat-hint>Deja vacío para permitir a todos los grupos. Útil para restringir contra reembolso a clientes verificados.</mat-hint>
              </mat-form-field>
            }
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

        <!-- Redsys -->
        <mat-card class="mb-4">
          <mat-card-header>
            <mat-icon mat-card-avatar class="!text-3xl text-gray-600 mt-1">account_balance</mat-icon>
            <mat-card-title>Redsys / TPV Virtual</mat-card-title>
            <mat-card-subtitle>Pasarela bancaria española (Visa, Mastercard, American Express).</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="pt-4 space-y-4">
            <mat-slide-toggle [(ngModel)]="config.redsysEnabled">
              Habilitado
            </mat-slide-toggle>
            @if (config.redsysEnabled) {
              <mat-form-field class="w-full">
                <mat-label>Código de comercio (DS_MERCHANT_MERCHANTCODE)</mat-label>
                <input matInput [(ngModel)]="config.redsysMerchantCode" placeholder="999008881" />
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Terminal (DS_MERCHANT_TERMINAL)</mat-label>
                <input matInput [(ngModel)]="config.redsysTerminal" placeholder="1" />
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Clave secreta SHA-256</mat-label>
                <input matInput [(ngModel)]="config.redsysSecretKey" type="password" placeholder="sq7HjrUOBfKmC576..." />
                <mat-hint>Clave de firma del panel de administración de Redsys.</mat-hint>
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Países permitidos (ISO separados por coma)</mat-label>
                <input matInput [(ngModel)]="config.redsysAllowedCountries" placeholder="ES, PT" />
                <mat-hint>Deja vacío para todos los países.</mat-hint>
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Grupos de clientes permitidos (IDs por coma)</mat-label>
                <input matInput [(ngModel)]="config.redsysAllowedGroups" placeholder="1, 2" />
                <mat-hint>Deja vacío para todos los grupos.</mat-hint>
              </mat-form-field>
            }
          </mat-card-content>
        </mat-card>

        <!-- Bizum -->
        <mat-card class="mb-4">
          <mat-card-header>
            <mat-icon mat-card-avatar class="!text-3xl text-gray-600 mt-1">phone_android</mat-icon>
            <mat-card-title>📱 Bizum</mat-card-title>
            <mat-card-subtitle>Pago móvil español vía Redsys. Comparte credenciales con TPV Virtual.</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="pt-4 space-y-4">
            <mat-slide-toggle [(ngModel)]="config.bizumEnabled">
              Habilitado
            </mat-slide-toggle>
            @if (config.bizumEnabled && !config.redsysEnabled) {
              <p class="text-amber-600 text-sm">
                ⚠️ Bizum requiere las credenciales de Redsys. Activa y configura Redsys primero.
              </p>
            }
            <p class="text-sm text-gray-500">
              Bizum utiliza las mismas credenciales que Redsys (mismo comercio). Activa Redsys y configura las claves allí.
            </p>
            <mat-form-field class="w-full">
              <mat-label>Grupos de clientes permitidos para Bizum (IDs por coma)</mat-label>
              <input matInput [(ngModel)]="config.bizumAllowedGroups" placeholder="1, 2, 3" />
              <mat-hint>Deja vacío para todos los grupos.</mat-hint>
            </mat-form-field>
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
    codSurchargeAmount: '0',
    codAllowedCountries: '',
    codAllowedGroups: '',
    bankTransferAllowedCountries: '',
    bankTransferAllowedGroups: '',
    redsysEnabled: false,
    redsysMerchantCode: '',
    redsysTerminal: '1',
    redsysSecretKey: '',
    redsysAllowedCountries: '',
    redsysAllowedGroups: '',
    bizumEnabled: false,
    bizumAllowedGroups: '',
  };

  private readonly KEY_MAP: Record<keyof PaymentConfig, string> = {
    bankTransferEnabled: 'PAYMENT_BANK_TRANSFER_ENABLED',
    cashOnDeliveryEnabled: 'PAYMENT_CASH_ON_DELIVERY_ENABLED',
    stripeEnabled: 'PAYMENT_STRIPE_ENABLED',
    stripePublicKey: 'STRIPE_PUBLIC_KEY',
    stripeSecretKey: 'STRIPE_SECRET_KEY',
    stripeWebhookSecret: 'STRIPE_WEBHOOK_SECRET',
    codSurchargeAmount: 'PAYMENT_COD_SURCHARGE_AMOUNT',
    codAllowedCountries: 'PAYMENT_COD_ALLOWED_COUNTRIES',
    codAllowedGroups: 'PAYMENT_COD_ALLOWED_GROUPS',
    bankTransferAllowedCountries: 'PAYMENT_BANK_TRANSFER_ALLOWED_COUNTRIES',
    bankTransferAllowedGroups: 'PAYMENT_BANK_TRANSFER_ALLOWED_GROUPS',
    redsysEnabled: 'PAYMENT_REDSYS_ENABLED',
    redsysMerchantCode: 'REDSYS_MERCHANT_CODE',
    redsysTerminal: 'REDSYS_TERMINAL',
    redsysSecretKey: 'REDSYS_SECRET_KEY',
    redsysAllowedCountries: 'PAYMENT_REDSYS_ALLOWED_COUNTRIES',
    redsysAllowedGroups: 'PAYMENT_REDSYS_ALLOWED_GROUPS',
    bizumEnabled: 'PAYMENT_BIZUM_ENABLED',
    bizumAllowedGroups: 'PAYMENT_BIZUM_ALLOWED_GROUPS',
  };

  ngOnInit(): void {
    this.api.get<any>('/configurations', { prefix: 'PAYMENT_,STRIPE_,REDSYS_' }).subscribe({
      next: (res) => {
        const map = new Map<string, string>();
        for (const c of res.data) map.set(c.key, c.value);
        this.config.bankTransferEnabled = map.get('PAYMENT_BANK_TRANSFER_ENABLED') !== '0';
        this.config.cashOnDeliveryEnabled = map.get('PAYMENT_CASH_ON_DELIVERY_ENABLED') !== '0';
        this.config.stripeEnabled = map.get('PAYMENT_STRIPE_ENABLED') === '1';
        this.config.stripePublicKey = map.get('STRIPE_PUBLIC_KEY') ?? '';
        this.config.stripeSecretKey = map.get('STRIPE_SECRET_KEY') ?? '';
        this.config.stripeWebhookSecret = map.get('STRIPE_WEBHOOK_SECRET') ?? '';
        this.config.codSurchargeAmount = map.get('PAYMENT_COD_SURCHARGE_AMOUNT') ?? '0';
        this.config.codAllowedCountries = map.get('PAYMENT_COD_ALLOWED_COUNTRIES') ?? '';
        this.config.codAllowedGroups = map.get('PAYMENT_COD_ALLOWED_GROUPS') ?? '';
        this.config.bankTransferAllowedCountries = map.get('PAYMENT_BANK_TRANSFER_ALLOWED_COUNTRIES') ?? '';
        this.config.bankTransferAllowedGroups = map.get('PAYMENT_BANK_TRANSFER_ALLOWED_GROUPS') ?? '';
        this.config.redsysEnabled = map.get('PAYMENT_REDSYS_ENABLED') === '1';
        this.config.redsysMerchantCode = map.get('REDSYS_MERCHANT_CODE') ?? '';
        this.config.redsysTerminal = map.get('REDSYS_TERMINAL') ?? '1';
        this.config.redsysSecretKey = map.get('REDSYS_SECRET_KEY') ?? '';
        this.config.redsysAllowedCountries = map.get('PAYMENT_REDSYS_ALLOWED_COUNTRIES') ?? '';
        this.config.redsysAllowedGroups = map.get('PAYMENT_REDSYS_ALLOWED_GROUPS') ?? '';
        this.config.bizumEnabled = map.get('PAYMENT_BIZUM_ENABLED') === '1';
        this.config.bizumAllowedGroups = map.get('PAYMENT_BIZUM_ALLOWED_GROUPS') ?? '';
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
      { key: 'PAYMENT_COD_SURCHARGE_AMOUNT', value: this.config.codSurchargeAmount },
      { key: 'PAYMENT_COD_ALLOWED_COUNTRIES', value: this.config.codAllowedCountries },
      { key: 'PAYMENT_COD_ALLOWED_GROUPS', value: this.config.codAllowedGroups },
      { key: 'PAYMENT_BANK_TRANSFER_ALLOWED_COUNTRIES', value: this.config.bankTransferAllowedCountries },
      { key: 'PAYMENT_BANK_TRANSFER_ALLOWED_GROUPS', value: this.config.bankTransferAllowedGroups },
      { key: 'PAYMENT_REDSYS_ENABLED', value: this.config.redsysEnabled ? '1' : '0' },
      { key: 'REDSYS_MERCHANT_CODE', value: this.config.redsysMerchantCode },
      { key: 'REDSYS_TERMINAL', value: this.config.redsysTerminal },
      { key: 'REDSYS_SECRET_KEY', value: this.config.redsysSecretKey },
      { key: 'PAYMENT_REDSYS_ALLOWED_COUNTRIES', value: this.config.redsysAllowedCountries },
      { key: 'PAYMENT_REDSYS_ALLOWED_GROUPS', value: this.config.redsysAllowedGroups },
      { key: 'PAYMENT_BIZUM_ENABLED', value: this.config.bizumEnabled ? '1' : '0' },
      { key: 'PAYMENT_BIZUM_ALLOWED_GROUPS', value: this.config.bizumAllowedGroups },
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
