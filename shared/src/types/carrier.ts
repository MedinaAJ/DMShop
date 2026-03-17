export interface Carrier {
  id: number;
  name: string;
  idTaxRulesGroup: number | null;
  url: string | null;
  active: boolean;
  isFree: boolean;
  shippingMethod: 'weight' | 'price';
  maxWidth: number;
  maxHeight: number;
  maxDepth: number;
  maxWeight: number;
  grade: number;
  delay: number;
}

export interface CarrierZone {
  idCarrier: number;
  idZone: number;
}

export interface CarrierRange {
  id: number;
  idCarrier: number;
  delimiter1: number;
  delimiter2: number;
}

export interface CarrierRangePrice {
  id: number;
  idCarrierRange: number;
  idZone: number;
  price: number;
}
