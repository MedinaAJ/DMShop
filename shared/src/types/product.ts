import type { SoftDeletableEntity, TranslatableEntity } from './common.js';

export interface Product extends SoftDeletableEntity, TranslatableEntity {
  id: number;
  idCategoryDefault: number;
  idManufacturer: number | null;
  idSupplier: number | null;
  idTaxRuleGroup: number;
  reference: string | null;
  ean13: string | null;
  price: number;
  wholesalePrice: number;
  weight: number;
  quantity: number;
  active: boolean;
  availableForOrder: boolean;
  showPrice: boolean;
  isVirtual: boolean;
}

export interface ProductLang {
  idProduct: number;
  idLang: number;
  name: string;
  description: string | null;
  descriptionShort: string | null;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface ProductImage {
  id: number;
  idProduct: number;
  position: number;
  cover: boolean;
  path: string;
}

export interface ProductCombination {
  id: number;
  idProduct: number;
  reference: string | null;
  ean13: string | null;
  priceImpact: number;
  weightImpact: number;
  quantity: number;
  isDefault: boolean;
  attributeValues?: AttributeValuePublic[];
}

export interface Attribute extends TranslatableEntity {
  id: number;
  position: number;
}

export interface AttributeValue {
  id: number;
  idAttribute: number;
  color: string | null;
  position: number;
}

export interface AttributeValuePublic {
  id: number;
  idAttribute: number;
  attributeName: string;
  valueName: string;
  color: string | null;
}

export interface Feature extends TranslatableEntity {
  id: number;
  position: number;
}

export interface FeatureValue extends TranslatableEntity {
  id: number;
  idFeature: number;
}

export interface Manufacturer {
  id: number;
  name: string;
  active: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  active: boolean;
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  priceWithTax: number;
  coverImage: string | null;
  reference: string | null;
  quantity: number;
  active: boolean;
  categoryName: string;
  manufacturerName: string | null;
}
