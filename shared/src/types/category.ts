import type { SoftDeletableEntity, TranslatableEntity } from './common.js';

export interface Category extends SoftDeletableEntity, TranslatableEntity {
  id: number;
  idParent: number | null;
  position: number;
  active: boolean;
}

export interface CategoryLang {
  idCategory: number;
  idLang: number;
  name: string;
  description: string | null;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface CategoryTree {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  children: CategoryTree[];
}
