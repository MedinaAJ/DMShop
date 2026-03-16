import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.string().optional(),
  q: z.string().optional(),
  lang: z.string().length(2).optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
