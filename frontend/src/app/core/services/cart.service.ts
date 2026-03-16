import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

interface CartItem {
  id: number;
  idProduct: number;
  idCombination: number | null;
  quantity: number;
  productName: string;
  productSlug: string;
  productPrice: number;
  productPriceWithTax: number;
  combinationName: string | null;
  coverImage: string | null;
  totalPrice: number;
  totalPriceWithTax: number;
}

interface CartSummary {
  items: CartItem[];
  totalProducts: number;
  totalProductsTax: number;
  totalShipping: number;
  totalShippingTax: number;
  totalDiscounts: number;
  totalDiscountsTax: number;
  totalPaid: number;
  itemCount: number;
}

interface CartResponse {
  success: boolean;
  data: CartSummary;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ApiService);

  private readonly _cart = signal<CartSummary | null>(null);
  private readonly _loading = signal(false);

  readonly cart = this._cart.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly itemCount = computed(() => this._cart()?.itemCount ?? 0);
  readonly total = computed(() => this._cart()?.totalPaid ?? 0);

  async load(): Promise<void> {
    try {
      this._loading.set(true);
      const res = await firstValueFrom(this.api.get<CartResponse>('/cart'));
      this._cart.set(res.data);
    } catch {
      this._cart.set(null);
    } finally {
      this._loading.set(false);
    }
  }

  async addItem(idProduct: number, quantity = 1, idCombination?: number): Promise<void> {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(
        this.api.post<CartResponse>('/cart/items', { idProduct, quantity, idCombination }),
      );
      this._cart.set(res.data);
    } finally {
      this._loading.set(false);
    }
  }

  async updateItem(itemId: number, quantity: number): Promise<void> {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(
        this.api.put<CartResponse>(`/cart/items/${itemId}`, { quantity }),
      );
      this._cart.set(res.data);
    } finally {
      this._loading.set(false);
    }
  }

  async removeItem(itemId: number): Promise<void> {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(this.api.delete<CartResponse>(`/cart/items/${itemId}`));
      this._cart.set(res.data);
    } finally {
      this._loading.set(false);
    }
  }

  clear(): void {
    this._cart.set(null);
  }
}
