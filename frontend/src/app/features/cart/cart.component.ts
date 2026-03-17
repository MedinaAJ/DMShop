import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, CurrencyPipe],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Carrito de compra</h1>

      @if (cartService.loading()) {
        <div class="flex justify-center py-12">
          <mat-spinner diameter="48" />
        </div>
      } @else if (cartService.cart()?.items?.length) {
        <div class="space-y-4">
          @for (item of cartService.cart()!.items; track item.id) {
            <div class="flex items-center gap-4 bg-white rounded-lg shadow p-4">
              @if (item.coverImage) {
                <img
                  [src]="item.coverImage"
                  [alt]="item.productName"
                  class="w-20 h-20 object-cover rounded"
                />
              } @else {
                <div class="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                  <mat-icon class="text-gray-300">image</mat-icon>
                </div>
              }

              <div class="flex-1 min-w-0">
                <a
                  [routerLink]="['/product', item.idProduct]"
                  class="font-semibold text-blue-600 hover:underline truncate block"
                >
                  {{ item.productName }}
                </a>
                @if (item.combinationName) {
                  <p class="text-sm text-gray-500">{{ item.combinationName }}</p>
                }
                <p class="text-sm text-gray-400">
                  {{ item.productPriceWithTax | currency: 'EUR' }} / ud.
                </p>
              </div>

              <div class="flex items-center border rounded">
                <button
                  mat-icon-button
                  (click)="updateQty(item.id, item.quantity - 1)"
                  [disabled]="item.quantity <= 1"
                >
                  <mat-icon>remove</mat-icon>
                </button>
                <span class="px-3 font-semibold">{{ item.quantity }}</span>
                <button mat-icon-button (click)="updateQty(item.id, item.quantity + 1)">
                  <mat-icon>add</mat-icon>
                </button>
              </div>

              <p class="font-bold w-24 text-right">
                {{ item.totalPriceWithTax | currency: 'EUR' }}
              </p>

              <button mat-icon-button color="warn" (click)="remove(item.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          }
        </div>

        <!-- Summary -->
        <div class="mt-8 bg-white rounded-lg shadow p-6">
          <div class="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>{{ cartService.cart()!.totalProducts | currency: 'EUR' }}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span>Impuestos</span>
            <span>{{ cartService.cart()!.totalProductsTax | currency: 'EUR' }}</span>
          </div>
          @if (cartService.cart()!.totalShipping > 0) {
            <div class="flex justify-between mb-2">
              <span>Envío</span>
              <span>{{ cartService.cart()!.totalShipping | currency: 'EUR' }}</span>
            </div>
          }
          @if (cartService.cart()!.totalDiscounts > 0) {
            <div class="flex justify-between mb-2 text-green-600">
              <span>Descuentos</span>
              <span>-{{ cartService.cart()!.totalDiscounts | currency: 'EUR' }}</span>
            </div>
          }

          <!-- Applied coupons -->
          @if (cartService.cart()!.appliedDiscounts?.length) {
            <div class="mb-3">
              @for (d of cartService.cart()!.appliedDiscounts!; track d.id) {
                <div class="flex items-center justify-between text-sm bg-green-50 rounded px-3 py-1.5 mb-1">
                  <span class="text-green-700">
                    <mat-icon class="!text-base align-middle mr-1">local_offer</mat-icon>
                    {{ d.name }} @if (d.code) { ({{ d.code }}) }
                  </span>
                  <button mat-icon-button class="!w-6 !h-6" (click)="removeDiscount(d.id)">
                    <mat-icon class="!text-base text-red-400">close</mat-icon>
                  </button>
                </div>
              }
            </div>
          }

          <!-- Coupon input -->
          <div class="flex items-center gap-2 mb-3">
            <mat-form-field appearance="outline" class="flex-1 !mb-0" subscriptSizing="dynamic">
              <mat-label>Código de cupón</mat-label>
              <input matInput [(ngModel)]="couponCode" name="coupon" (keyup.enter)="applyCoupon()" />
            </mat-form-field>
            <button mat-stroked-button (click)="applyCoupon()" [disabled]="!couponCode()">
              Aplicar
            </button>
          </div>

          <hr class="my-3" />
          <div class="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span>{{ cartService.cart()!.totalPaid | currency: 'EUR' }}</span>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <a mat-button routerLink="/catalog">Seguir comprando</a>
            <a mat-flat-button color="primary" routerLink="/checkout" class="!px-8">
              Finalizar compra
            </a>
          </div>
        </div>
      } @else {
        <div class="text-center py-16">
          <mat-icon class="!text-6xl text-gray-300 mb-4">shopping_cart</mat-icon>
          <h2 class="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
          <p class="text-gray-500 mb-6">Añade productos para comenzar tu compra.</p>
          <a mat-flat-button routerLink="/catalog">Ver catálogo</a>
        </div>
      }
    </div>
  `,
})
export class CartComponent {
  readonly cartService = inject(CartService);
  private readonly snack = inject(MatSnackBar);
  readonly couponCode = signal('');

  async updateQty(itemId: number, quantity: number): Promise<void> {
    if (quantity < 1) return;
    await this.cartService.updateItem(itemId, quantity);
  }

  async remove(itemId: number): Promise<void> {
    await this.cartService.removeItem(itemId);
  }

  async applyCoupon(): Promise<void> {
    const code = this.couponCode().trim();
    if (!code) return;
    try {
      await this.cartService.applyDiscount(code);
      this.couponCode.set('');
      this.snack.open('Cupón aplicado', 'OK', { duration: 2000 });
    } catch {
      this.snack.open('Cupón inválido o expirado', 'Cerrar', { duration: 3000 });
    }
  }

  async removeDiscount(cartRuleId: number): Promise<void> {
    await this.cartService.removeDiscount(cartRuleId);
  }
}
