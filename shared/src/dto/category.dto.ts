export interface CreateCategoryRequest {
  idParent?: number | null;
  position?: number;
  active?: boolean;
  translations: Record<
    string,
    {
      name: string;
      description?: string | null;
      slug: string;
      metaTitle?: string | null;
      metaDescription?: string | null;
    }
  >;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}
