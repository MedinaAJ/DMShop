import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface Review {
  id: number;
  rating: number;
  title: string;
  content: string;
  created_at: string;
  user: { firstName: string };
}

export interface ReviewStats {
  reviews: Review[];
  avgRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

interface ReviewsResponse {
  success: boolean;
  data: ReviewStats;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly api = inject(ApiService);

  async getProductReviews(productId: number, page = 1): Promise<ReviewStats> {
    const res = await firstValueFrom(
      this.api.get<ReviewsResponse>(`/products/${productId}/reviews`, { page }),
    );
    return res.data;
  }

  async submitReview(
    productId: number,
    data: { rating: number; title: string; content: string },
  ): Promise<void> {
    await firstValueFrom(this.api.post(`/products/${productId}/reviews`, data));
  }
}
