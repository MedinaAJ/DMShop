import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { OrderService, AddressOption, CarrierOption, CartSummaryResponse } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService, PaymentMethodOption } from '../../core/services/payment.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    RouterLink, MatStepperModule, MatButtonModule, MatIconModule, MatRadioModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatCardModule,
    MatDividerModule, MatSnackBarModule, FormsModule, CurrencyPipe,
  ],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Finalizar compra</h1>

      @if (!authService.isAuthenticated()) {
        <div class="text-center py-16">
          <mat-icon class="!text-6xl text-gray-300 mb-4">lock</mat-icon>
          <h2 class="text-xl font-semibold mb-2">Inicia sesión para continuar</h2>
          <p class="text-gray-500 mb-6">Necesitas una cuenta para realizar tu pedido.</p>
          <a mat-flat-button color="primary" routerLink="/auth/login">Iniciar sesión</a>
        </div>
      } @else if (loading()) {
        <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
      } @else if (addresses.length === 0) {
        <div class="text-center py-16">
          <mat-icon class="!text-6xl text-gray-300 mb-4">location_off</mat-icon>
          <h2 class="text-xl font-semibold mb-2">No tienes direcciones</h2>
          <p class="text-gray-500 mb-6">Añade una dirección de envío antes de continuar.</p>
          <a mat-flat-button color="primary" routerLink="/account/addresses/new">Añadir dirección</a>
        </div>
      } @else {
        <mat-stepper [linear]="true" #stepper>
          <!-- Step 1: Address -->
          <mat-step [completed]="!!selectedAddressId">
            <ng-template matStepLabel>Dirección de envío</ng-template>
            <div class="py-4 space-y-3">
              @for (addr of addresses; track addr.id) {
                <div class="border rounded-lg p-4 cursor-pointer transition"
                     [class.border-blue-500]="selectedAddressId === addr.id"
                     [class.bg-blue-50]="selectedAddressId === addr.id"
                     (click)="selectAddress(addr.id)">
                  <div class="flex items-start gap-3">
                    <mat-icon [class.text-blue-600]="selectedAddressId === addr.id">
                      {{ selectedAddressId === addr.id ? 'radio_button_checked' : 'radio_button_unchecked' }}
                    </mat-icon>
                    <div>
                      <p class="font-semibold">{{ addr.alias }} — {{ addr.firstName }} {{ addr.lastName }}</p>
                      <p class="text-sm text-gray-600">{{ addr.address1 }}, {{ addr.postcode }} {{ addr.city }}</p>
                      <p class="text-sm text-gray-400">{{ addr.country.name }}</p>
                    </div>
                  </div>
                </div>
              }
              <div class="flex justify-between mt-4">
                <a mat-button routerLink="/account/addresses/new"><mat-icon>add</mat-icon> Nueva dirección</a>
                <button mat-flat-button matStepperNext color="primary" [disabled]="!selectedAddressId">Continuar</button>
              </div>
            </div>
          </mat-step>

          <!-- Step 2: Carrier -->
          <mat-step [completed]="!!selectedCarrierId">
            <ng-template matStepLabel>Método de envío</ng-template>
            <div class="py-4 space-y-3">
              @if (loadingCarriers()) {
                <div class="flex justify-center py-6"><mat-spinner diameter="36" /></div>
              } @else if (carriers.length === 0) {
                <p class="text-gray-500 py-4">No hay transportistas disponibles para tu zona.</p>
              } @else {
                @for (c of carriers; track c.id) {
                  <div class="border rounded-lg p-4 cursor-pointer transition"
                       [class.border-blue-500]="selectedCarrierId === c.id"
                       [class.bg-blue-50]="selectedCarrierId === c.id"
                       (click)="selectCarrier(c.id)">
                    <div class="flex items-center gap-3">
                      <mat-icon [class.text-blue-600]="selectedCarrierId === c.id">
                        {{ selectedCarrierId === c.id ? 'radio_button_checked' : 'radio_button_unchecked' }}
                      </mat-icon>
                      <div class="flex-1">
                        <p class="font-semibold">{{ c.name }}</p>
                        <p class="text-sm text-gray-500">Entrega en {{ c.delay }} días</p>
                      </div>
                      <span class="font-semibold text-blue-700">
                        {{ getCarrierPriceLabel(c) }}
                      </span>
                    </div>
                  </div>
                }
              }
              <div class="flex justify-between mt-4">
                <button mat-button matStepperPrevious>Atrás</button>
                <button mat-flat-button matStepperNext color="primary" [disabled]="!selectedCarrierId">Continuar</button>
              </div>
            </div>
          </mat-step>

          <!-- Step 3: Payment & Summary -->
          <mat-step [completed]="false">
            <ng-template matStepLabel>Resumen y pago</ng-template>
            <div class="py-4">
              @if (loadingSummary()) {
                <div class="flex justify-center py-6"><mat-spinner diameter="36" /></div>
              } @else if (summary) {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Order items -->
                  <div>
                    <h3 class="font-semibold mb-3">Productos</h3>
                    @for (item of summary.items; track item.id) {
                      <div class="flex justify-between py-2 border-b border-gray-100">
                        <div>
                          <p>{{ item.productName }}</p>
                          <p class="text-sm text-gray-500">x{{ item.quantity }}</p>
                        </div>
                        <p class="font-semibold">{{ item.totalPriceWithTax | currency:'EUR' }}</p>
                      </div>
                    }
                    <div class="mt-4 space-y-1 text-sm">
                      <div class="flex justify-between"><span>Subtotal</span><span>{{ summary.totalProductsTax | currency:'EUR' }}</span></div>
                      <div class="flex justify-between"><span>Envío</span><span>{{ summary.totalShippingTax | currency:'EUR' }}</span></div>
                      @if (summary.totalDiscountsTax > 0) {
                        <div class="flex justify-between text-green-600"><span>Descuentos</span><span>-{{ summary.totalDiscountsTax | currency:'EUR' }}</span></div>
                      }
                      @if (summary.paymentSurcharge && summary.paymentSurcharge > 0) {
                        <div class="flex justify-between text-orange-600">
                          <span>Recargo ({{ paymentMethod }})</span>
                          <span>+{{ summary.paymentSurcharge | currency:'EUR' }}</span>
                        </div>
                      }
                      <mat-divider />
                      <div class="flex justify-between text-lg font-bold pt-2"><span>Total</span><span>{{ summary.totalPaid | currency:'EUR' }}</span></div>
                    </div>
                  </div>

                  <!-- Payment method -->
                  <div>
                    <h3 class="font-semibold mb-3">Método de pago</h3>
                    @if (loadingMethods()) {
                      <div class="flex justify-center py-4"><mat-spinner diameter="28" /></div>
                    } @else if (paymentMethods.length === 0) {
                      <p class="text-gray-500">No hay métodos de pago disponibles.</p>
                    } @else {
                      <div class="space-y-3">
                        @for (pm of paymentMethods; track pm.name) {
                          <div class="border rounded-lg p-4 cursor-pointer transition"
                               [class.border-blue-500]="paymentMethod === pm.name"
                               [class.bg-blue-50]="paymentMethod === pm.name"
                               (click)="selectPaymentMethod(pm.name)">
                            <div class="flex items-center gap-3">
                              <mat-icon [class.text-blue-600]="paymentMethod === pm.name">
                                {{ paymentMethod === pm.name ? 'radio_button_checked' : 'radio_button_unchecked' }}
                              </mat-icon>
                              @if (pm.name === 'bizum') {
                                <span class="text-xl">📱</span>
                              } @else {
                                <mat-icon class="text-gray-500">{{ pm.icon }}</mat-icon>
                              }
                              <div class="flex-1">
                                <p class="font-semibold">{{ pm.displayName }}</p>
                                <p class="text-sm text-gray-500">{{ pm.description }}</p>
                              </div>
                              @if (pm.surchargeAmount && pm.surchargeAmount > 0) {
                                <span class="text-sm text-orange-600 font-medium">+{{ pm.surchargeAmount | currency:'EUR' }}</span>
                              }
                              @if (pm.surchargePercent && pm.surchargePercent > 0) {
                                <span class="text-sm text-orange-600 font-medium">+{{ pm.surchargePercent }}%</span>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    }

                    <mat-form-field class="w-full mt-4">
                      <mat-label>Nota (opcional)</mat-label>
                      <textarea matInput [(ngModel)]="orderNote" rows="2"></textarea>
                    </mat-form-field>
                  </div>
                </div>
              }

              <div class="flex justify-between mt-6">
                <button mat-button matStepperPrevious>Atrás</button>
                <button mat-flat-button color="primary" (click)="placeOrder()" [disabled]="placing() || !paymentMethod">
                  @if (placing()) {
                    <mat-spinner diameter="20" class="inline-block mr-2" />
                  }
                  @if (paymentMethod === 'paypal') {
                    <ng-container><mat-icon>account_balance_wallet</mat-icon> Pagar con PayPal</ng-container>
                  } @else if (paymentMethod === 'bizum') {
                    📱 Pagar con Bizum
                  } @else if (paymentMethod === 'redsys') {
                    <ng-container><mat-icon>credit_card</mat-icon> Pagar con tarjeta (TPV)</ng-container>
                  } @else {
                    Confirmar pedido
                  }
                </button>
              </div>
            </div>
          </mat-step>
        </mat-stepper>
      }
    </div>
  `,
})
export class CheckoutComponent implements OnInit {
  readonly orderService = inject(OrderService);
  readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  private readonly paymentService = inject(PaymentService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  addresses: AddressOption[] = [];
  carriers: CarrierOption[] = [];
  paymentMethods: PaymentMethodOption[] = [];
  summary: CartSummaryResponse | null = null;

  selectedAddressId: number | null = null;
  selectedCarrierId: number | null = null;
  paymentMethod = '';
  orderNote = '';

  loading = signal(true);
  loadingCarriers = signal(false);
  loadingSummary = signal(false);
  loadingMethods = signal(false);
  placing = signal(false);

  ngOnInit(): void {
    this.loadAddresses();
  }

  async loadAddresses(): Promise<void> {
    try {
      const [addrRes, methods] = await Promise.all([
        this.orderService.getAddresses(),
        this.paymentService.getAvailableMethods(),
      ]);
      this.addresses = addrRes.data;
      this.paymentMethods = methods;
      if (methods.length > 0) this.paymentMethod = methods[0].name;
    } catch { /* empty */ }
    this.loading.set(false);
  }

  async selectAddress(id: number): Promise<void> {
    this.selectedAddressId = id;
    this.selectedCarrierId = null;
    this.carriers = [];
    this.summary = null;

    this.loadingCarriers.set(true);
    try {
      const res = await this.orderService.getCarriers(id);
      this.carriers = res.data;
    } catch { /* empty */ }
    this.loadingCarriers.set(false);
  }

  async selectCarrier(id: number): Promise<void> {
    this.selectedCarrierId = id;
    if (!this.selectedAddressId) return;

    this.loadingSummary.set(true);
    try {
      const res = await this.orderService.calculateSummary(this.selectedAddressId, id, this.paymentMethod);
      this.summary = res.data;
    } catch { /* empty */ }
    this.loadingSummary.set(false);
  }

  async selectPaymentMethod(name: string): Promise<void> {
    this.paymentMethod = name;
    // Recalculate summary to reflect surcharge change
    if (this.selectedAddressId && this.selectedCarrierId) {
      this.loadingSummary.set(true);
      try {
        const res = await this.orderService.calculateSummary(this.selectedAddressId, this.selectedCarrierId, name);
        this.summary = res.data;
      } catch { /* empty */ }
      this.loadingSummary.set(false);
    }
  }

  getCarrierPriceLabel(carrier: CarrierOption): string {
    if (carrier.isFreeShipping || carrier.is_free) return 'Gratis';
    if (carrier.estimatedCostWithTax !== undefined) {
      return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(carrier.estimatedCostWithTax);
    }
    return '—';
  }

  async placeOrder(): Promise<void> {
    if (!this.selectedAddressId || !this.selectedCarrierId || !this.paymentMethod) return;

    this.placing.set(true);
    try {
      // 1. Create the order
      const res = await this.orderService.placeOrder({
        idAddressDelivery: this.selectedAddressId,
        idCarrier: this.selectedCarrierId,
        paymentMethod: this.paymentMethod,
        note: this.orderNote || undefined,
      });

      const orderId = res.data.id;

      // 2. Process payment
      const paymentResult = await this.paymentService.processPayment(orderId, this.paymentMethod);

      // Clear cart
      this.cartService.clear();
      await this.cartService.load();

      if (paymentResult.status === 'redirect' && paymentResult.redirectUrl) {
        // Redirect to external payment page (e.g. Stripe Checkout)
        window.location.href = paymentResult.redirectUrl;
        return;
      }

      this.snack.open('¡Pedido realizado con éxito!', 'OK', { duration: 4000 });
      this.router.navigate(['/account/orders', orderId]);
    } catch (err: any) {
      const msg = err?.error?.errors?.[0]?.message || 'Error al procesar el pedido';
      this.snack.open(msg, 'Cerrar', { duration: 4000 });
    } finally {
      this.placing.set(false);
    }
  }
}
