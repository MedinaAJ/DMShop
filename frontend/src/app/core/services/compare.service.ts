import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface CompareProduct {
  id: number;
  name: string;
  price: number;
  coverImage?: string;
}

const MAX_COMPARE = 3;

@Injectable({ providedIn: 'root' })
export class CompareService {
  private readonly _products = signal<CompareProduct[]>([]);

  readonly products = this._products.asReadonly();
  readonly count = computed(() => this._products().length);
  readonly canAdd = computed(() => this._products().length < MAX_COMPARE);

  isSelected(id: number): boolean {
    return this._products().some((p) => p.id === id);
  }

  toggle(product: CompareProduct): void {
    const current = this._products();
    const idx = current.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this._products.set(current.filter((p) => p.id !== product.id));
    } else if (current.length < MAX_COMPARE) {
      this._products.set([...current, product]);
    }
  }

  remove(id: number): void {
    this._products.update((ps) => ps.filter((p) => p.id !== id));
  }

  clear(): void {
    this._products.set([]);
  }

  getIds(): number[] {
    return this._products().map((p) => p.id);
  }
}
