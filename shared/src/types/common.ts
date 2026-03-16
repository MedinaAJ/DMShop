export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  errors?: ApiError[];
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface TranslatableEntity {
  translations?: Record<string, Record<string, unknown>>;
}

export interface TimestampedEntity {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletableEntity extends TimestampedEntity {
  deletedAt: Date | null;
}
