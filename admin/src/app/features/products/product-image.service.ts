import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface ProductImage {
  id: number;
  id_product: number;
  path: string;
  position: number;
  cover: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductImageService {
  private readonly api = inject(ApiService);

  getImages(productId: number): Observable<{ success: boolean; data: ProductImage[] }> {
    return this.api.get<{ success: boolean; data: ProductImage[] }>(
      `/products/${productId}/images`,
    );
  }

  uploadImage(
    productId: number,
    formData: FormData,
  ): Observable<{ success: boolean; data: ProductImage }> {
    return this.api.upload<{ success: boolean; data: ProductImage }>(
      `/products/${productId}/images`,
      formData,
    );
  }

  setCover(
    productId: number,
    imageId: number,
  ): Observable<{ success: boolean; data: ProductImage }> {
    return this.api.put<{ success: boolean; data: ProductImage }>(
      `/products/${productId}/images/${imageId}/cover`,
      {},
    );
  }

  updateImage(
    productId: number,
    imageId: number,
    data: { cover?: boolean; position?: number },
  ): Observable<{ success: boolean; data: ProductImage }> {
    return this.api.put<{ success: boolean; data: ProductImage }>(
      `/products/${productId}/images/${imageId}`,
      data,
    );
  }

  reorderImages(
    productId: number,
    items: Array<{ id: number; position: number }>,
  ): Observable<{ success: boolean; data: ProductImage[] }> {
    return this.api.put<{ success: boolean; data: ProductImage[] }>(
      `/products/${productId}/images/reorder`,
      items,
    );
  }

  deleteImage(productId: number, imageId: number): Observable<void> {
    return this.api.delete<void>(`/products/${productId}/images/${imageId}`);
  }
}
