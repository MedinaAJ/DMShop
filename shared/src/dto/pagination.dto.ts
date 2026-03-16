export interface PaginationQuery {
  page?: number;
  perPage?: number;
  sort?: string;
  q?: string;
  lang?: string;
}

export interface ProductFilterQuery extends PaginationQuery {
  idCategory?: number;
  idManufacturer?: number;
  priceMin?: number;
  priceMax?: number;
  active?: boolean;
  inStock?: boolean;
  attributes?: string; // comma-separated attribute value IDs
  features?: string; // comma-separated feature value IDs
}

export interface CategoryFilterQuery extends PaginationQuery {
  idParent?: number;
  active?: boolean;
}
