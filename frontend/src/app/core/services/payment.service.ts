import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface PaymentMethodOption {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  surchargePercent?: number;
  surchargeAmount?: number;
}

export interface PaymentProcessResult {
  status: 'completed' | 'pending' | 'redirect';
  redirectUrl?: string;
  transactionId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly api = inject(ApiService);

  async getAvailableMethods(): Promise<PaymentMethodOption[]> {
    const res = await firstValueFrom(
      this.api.get<{ success: boolean; data: PaymentMethodOption[] }>('/payment/methods'),
    );
    return res.data;
  }

  async processPayment(orderId: number, paymentMethod: string, paymentData?: unknown): Promise<PaymentProcessResult> {
    const res = await firstValueFrom(
      this.api.post<{ success: boolean; data: PaymentProcessResult }>('/payment/process', {
        orderId,
        paymentMethod,
        paymentData,
      }),
    );
    return res.data;
  }

  async getConfirmation(orderId: number) {
    return firstValueFrom(
      this.api.get<{ success: boolean; data: any }>(`/payment/confirmation/${orderId}`),
    );
  }
}
