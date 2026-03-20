import type { TimestampedEntity } from './common.js';

export interface Cart extends TimestampedEntity {
  id: number;
  idUser: number | null;
  idCurrency: number;
  idLang: number;
  idAddressDelivery: number | null;
  idAddressInvoice: number | null;
  idCarrier: number | null;
}

export interface CartItem extends TimestampedEntity {
  id: number;
  idCart: number;
  idProduct: number;
  idCombination: number | null;
  quantity: number;
}

export interface CartItemDetailed extends CartItem {
  productName: string;
  productSlug: string;
  productPrice: number;
  productPriceWithTax: number;
  combinationName: string | null;
  coverImage: string | null;
  totalPrice: number;
  totalPriceWithTax: number;
}

export interface CartSummary {
  items: CartItemDetailed[];
  totalProducts: number;
  totalProductsTax: number;
  totalShipping: number;
  totalShippingTax: number;
  totalDiscounts: number;
  totalDiscountsTax: number;
  groupDiscount?: number;
  paymentSurcharge?: number;
  totalPaid: number;
  itemCount: number;
  appliedDiscounts?: unknown[];
}
