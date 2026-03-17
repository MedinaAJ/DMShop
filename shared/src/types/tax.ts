export interface Tax {
  id: number;
  rate: number;
  active: boolean;
  name: string;
}

export interface TaxRulesGroup {
  id: number;
  name: string;
  active: boolean;
}

export interface TaxRule {
  id: number;
  idTaxRulesGroup: number;
  idCountry: number;
  idState: number;
  idTax: number;
  behavior: number;
}
