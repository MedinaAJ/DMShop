export interface CartRuleDto {
  id: number;
  code: string | null;
  name: string;
  description: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  quantity: number;
  quantityPerUser: number;
  priority: number;
  minimumAmount: number;
  freeShipping: boolean;
  reductionPercent: number;
  reductionAmount: number;
  idCustomer: number | null;
  active: boolean;
  createdAt: string;
}

export interface SpecificPriceDto {
  id: number;
  idProduct: number;
  idCombination: number | null;
  idCustomer: number | null;
  idCustomerGroup: number | null;
  idCurrency: number | null;
  idCountry: number | null;
  fromQuantity: number;
  price: number;
  reduction: number;
  reductionType: 'percentage' | 'amount';
  reductionTax: boolean;
  dateFrom: string | null;
  dateTo: string | null;
}

export interface AppliedDiscountDto {
  id: number;
  name: string;
  code: string | null;
  type: 'percent' | 'amount' | 'free_shipping';
  value: number;
  savings: number;
}
