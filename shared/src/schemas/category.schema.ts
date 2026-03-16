import { z } from 'zod';

const categoryTranslationSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().nullable().optional(),
  slug: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido'),
  metaTitle: z.string().max(128).nullable().optional(),
  metaDescription: z.string().max(255).nullable().optional(),
});

export const createCategorySchema = z.object({
  idParent: z.number().int().positive().nullable().optional(),
  position: z.number().int().min(0).optional().default(0),
  active: z.boolean().optional().default(true),
  translations: z
    .record(z.string(), categoryTranslationSchema)
    .refine((translations) => Object.keys(translations).length > 0, {
      message: 'Se requiere al menos una traducción',
    }),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
