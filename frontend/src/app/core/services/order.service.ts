import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface OrderListItem {
  id: number;
  reference: string;
  customerName: string;
  stateName: string;
  stateColor: string;
  paymentMethod: string;
  totalPaid: number;
  itemCount: number;
  createdAt: string;
}

export interface OrderDetail {
  id: number;
  reference: string;
  idOrderState: number;
  stateName: string;
  stateColor: string;
  paymentMethod: string;
  totalProducts: number;
  totalProductsTax: number;
  totalShipping: number;
  totalShippingTax: number;
  totalDiscounts: number;
  totalDiscountsTax: number;
  totalPaid: number;
  note: string | null;
  deliveryAddress: any;
  invoiceAddress: any;
  carrier: any;
  items: OrderItemDto[];
  history: OrderHistoryDto[];
  createdAt: string;
}

export interface OrderItemDto {
  id: number;
  productName: string;
  productReference: string | null;
  productPrice: number;
  productPriceTax: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderHistoryDto {
  id: number;
  stateName: string;
  stateColor: string;
  comment: string | null;
  createdAt: string;
}

export interface CarrierOption {
  id: number;
  name: string;
  is_free: boolean;
  delay: number;
  estimatedCost?: number;
  estimatedCostWithTax?: number;
  isFreeShipping?: boolean;
}

export interface CartSummaryResponse {
  items: any[];
  totalProducts: number;
  totalProductsTax: number;
  totalShipping: number;
  totalShippingTax: number;
  totalDiscounts: number;
  totalDiscountsTax: number;
  paymentSurcharge?: number;
  totalPaid: number;
  itemCount: number;
}

export interface AddressOption {
  id: number;
  alias: string;
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  postcode: string;
  country: { name: string };
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiService);

  async getMyOrders(page = 1, limit = 10) {
    return firstValueFrom(
      this.api.get<{ success: boolean; data: OrderListItem[]; meta: any }>('/orders', { page, limit }),
    );
  }

  async getMyOrderDetail(id: number) {
    return firstValueFrom(
      this.api.get<{ success: boolean; data: OrderDetail }>(`/orders/${id}`),
    );
  }

  async getAddresses() {
    return firstValueFrom(
      this.api.get<{ success: boolean; data: AddressOption[] }>('/addresses'),
    );
  }

  async getCarriers(idAddressDelivery: number) {
    return firstValueFrom(
      this.api.get<{ success: boolean; data: CarrierOption[] }>('/orders/carriers', { idAddressDelivery }),
    );
  }

  async calculateSummary(idAddressDelivery: number, idCarrier: number, paymentMethod?: string) {
    return firstValueFrom(
      this.api.post<{ success: boolean; data: CartSummaryResponse }>('/orders/calculate', { idAddressDelivery, idCarrier, paymentMethod }),
    );
  }

  async placeOrder(data: { idAddressDelivery: number; idAddressInvoice?: number; idCarrier: number; paymentMethod: string; note?: string }) {
    return firstValueFrom(
      this.api.post<{ success: boolean; data: OrderDetail }>('/orders', data),
    );
  }

  downloadInvoice(orderId: number) {
    return this.api.getBlob(`/orders/${orderId}/invoice`);
  }
}
