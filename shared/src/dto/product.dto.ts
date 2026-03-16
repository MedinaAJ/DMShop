export interface CreateProductRequest {
  idCategoryDefault: number;
  idManufacturer?: number | null;
  idSupplier?: number | null;
  idTaxRuleGroup: number;
  reference?: string | null;
  ean13?: string | null;
  price: number;
  wholesalePrice?: number;
  weight?: number;
  quantity?: number;
  active?: boolean;
  availableForOrder?: boolean;
  showPrice?: boolean;
  isVirtual?: boolean;
  translations: Record<
    string,
    {
      name: string;
      description?: string | null;
      descriptionShort?: string | null;
      slug: string;
      metaTitle?: string | null;
      metaDescription?: string | null;
    }
  >;
  categories?: number[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}
