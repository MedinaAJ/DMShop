import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

export interface WishlistProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  active: boolean;
  coverImage: string | null;
}

export interface WishlistItem {
  id_product: number;
  id_combination: number | null;
  created_at: string;
  product: WishlistProduct;
}

export interface WishlistData {
  id: number;
  name: string;
  items: WishlistItem[];
}

interface WishlistResponse {
  success: boolean;
  data: WishlistData;
}

interface CheckResponse {
  success: boolean;
  data: { inWishlist: boolean };
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly _wishlist = signal<WishlistData | null>(null);
  private readonly _loading = signal(false);
  private readonly _checkedProducts = signal<Map<number, boolean>>(new Map());

  readonly wishlist = this._wishlist.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly itemCount = computed(() => this._wishlist()?.items.length ?? 0);

  isInWishlist(productId: number): boolean {
    const map = this._checkedProducts();
    if (map.has(productId)) return map.get(productId)!;
    const wishlist = this._wishlist();
    if (!wishlist) return false;
    return wishlist.items.some((item) => item.id_product === productId);
  }

  async load(): Promise<void> {
    if (!this.auth.isAuthenticated()) return;
    try {
      this._loading.set(true);
      const res = await firstValueFrom(this.api.get<WishlistResponse>('/wishlist'));
      this._wishlist.set(res.data);
    } catch {
      // ignore
    } finally {
      this._loading.set(false);
    }
  }

  async addItem(productId: number, combinationId?: number | null): Promise<void> {
    if (!this.auth.isAuthenticated()) return;
    try {
      await firstValueFrom(
        this.api.post('/wishlist/items', {
          id_product: productId,
          id_combination: combinationId ?? null,
        }),
      );
      await this.load();
      // Update checked cache
      const map = new Map(this._checkedProducts());
      map.set(productId, true);
      this._checkedProducts.set(map);
    } catch {
      // ignore
    }
  }

  async removeItem(productId: number): Promise<void> {
    if (!this.auth.isAuthenticated()) return;
    try {
      await firstValueFrom(this.api.delete(`/wishlist/items/${productId}`));
      await this.load();
      const map = new Map(this._checkedProducts());
      map.set(productId, false);
      this._checkedProducts.set(map);
    } catch {
      // ignore
    }
  }

  async toggle(productId: number): Promise<void> {
    if (this.isInWishlist(productId)) {
      await this.removeItem(productId);
    } else {
      await this.addItem(productId);
    }
  }

  async check(productId: number): Promise<boolean> {
    if (!this.auth.isAuthenticated()) return false;
    try {
      const res = await firstValueFrom(
        this.api.get<CheckResponse>(`/wishlist/check/${productId}`),
      );
      const inWishlist = res.data.inWishlist;
      const map = new Map(this._checkedProducts());
      map.set(productId, inWishlist);
      this._checkedProducts.set(map);
      return inWishlist;
    } catch {
      return false;
    }
  }

  async share(wishlistId: number): Promise<string> {
    const res = await firstValueFrom(
      this.api.post<{ success: boolean; data: { shareUrl: string } }>(`/wishlist/${wishlistId}/share`, {}),
    );
    return res.data.shareUrl;
  }

  async getShared(token: string): Promise<WishlistData> {
    const res = await firstValueFrom(
      this.api.get<{ success: boolean; data: WishlistData }>(`/wishlist/shared/${token}`),
    );
    return res.data;
  }

  clear(): void {
    this._wishlist.set(null);
    this._checkedProducts.set(new Map());
  }
}
