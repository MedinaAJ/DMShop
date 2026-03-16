import type { TimestampedEntity } from './common.js';

export interface Order extends TimestampedEntity {
  id: number;
  reference: string;
  idUser: number;
  idCart: number;
  idCurrency: number;
  idLang: number;
  idAddressDelivery: number;
  idAddressInvoice: number;
  idCarrier: number;
  idOrderState: number;
  paymentMethod: string;
  totalProducts: number;
  totalProductsTax: number;
  totalShipping: number;
  totalShippingTax: number;
  totalDiscounts: number;
  totalDiscountsTax: number;
  totalPaid: number;
  conversionRate: number;
}

export interface OrderItem {
  id: number;
  idOrder: number;
  idProduct: number;
  idCombination: number | null;
  productName: string;
  productReference: string;
  productPrice: number;
  productPriceTax: number;
  quantity: number;
  taxRate: number;
}

export interface OrderState {
  id: number;
  color: string;
  paid: boolean;
  shipped: boolean;
  delivery: boolean;
  name?: string;
}

export interface OrderHistory {
  id: number;
  idOrder: number;
  idOrderState: number;
  idUser: number | null;
  createdAt: Date;
  stateName?: string;
}
