export interface CreateOrderDto {
  idAddressDelivery: number;
  idAddressInvoice?: number;
  idCarrier: number;
  paymentMethod: string;
  note?: string;
}

export interface OrderDetailDto {
  id: number;
  reference: string;
  idUser: number;
  customerName: string;
  customerEmail: string;
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
  deliveryAddress: OrderAddressDto;
  invoiceAddress: OrderAddressDto;
  carrier: OrderCarrierDto | null;
  items: OrderItemDto[];
  history: OrderHistoryDto[];
  payments: OrderPaymentDto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderListItemDto {
  id: number;
  reference: string;
  customerName: string;
  customerEmail: string;
  stateName: string;
  stateColor: string;
  paymentMethod: string;
  totalPaid: number;
  itemCount: number;
  createdAt: Date;
}

export interface OrderItemDto {
  id: number;
  idProduct: number;
  idCombination: number | null;
  productName: string;
  productReference: string | null;
  productPrice: number;
  productPriceTax: number;
  quantity: number;
  taxRate: number;
  totalPrice: number;
}

export interface OrderAddressDto {
  id: number;
  alias: string;
  firstName: string;
  lastName: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  postcode: string;
  country: string;
  state: string | null;
  phone: string | null;
}

export interface OrderCarrierDto {
  id: number;
  carrierName: string;
  trackingNumber: string | null;
  weight: number;
  shippingCost: number;
  shippingCostTax: number;
}

export interface OrderHistoryDto {
  id: number;
  idOrderState: number;
  stateName: string;
  stateColor: string;
  userName: string | null;
  comment: string | null;
  createdAt: Date;
}

export interface OrderPaymentDto {
  id: number;
  paymentMethod: string;
  transactionId: string | null;
  amount: number;
  currencyCode: string;
  createdAt: Date;
}
