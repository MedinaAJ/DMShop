import { z } from 'zod';

const translationSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().nullable().optional(),
  descriptionShort: z.string().nullable().optional(),
  slug: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido (solo minúsculas, números y guiones)'),
  metaTitle: z.string().max(128).nullable().optional(),
  metaDescription: z.string().max(255).nullable().optional(),
});

export const createProductSchema = z.object({
  idCategoryDefault: z.number().int().positive(),
  idManufacturer: z.number().int().positive().nullable().optional(),
  idSupplier: z.number().int().positive().nullable().optional(),
  idTaxRuleGroup: z.number().int().positive(),
  reference: z.string().max(64).nullable().optional(),
  ean13: z.string().length(13).nullable().optional(),
  price: z.number().min(0),
  wholesalePrice: z.number().min(0).optional().default(0),
  weight: z.number().min(0).optional().default(0),
  quantity: z.number().int().min(0).optional().default(0),
  active: z.boolean().optional().default(true),
  availableForOrder: z.boolean().optional().default(true),
  showPrice: z.boolean().optional().default(true),
  isVirtual: z.boolean().optional().default(false),
  translations: z
    .record(z.string(), translationSchema)
    .refine((translations) => Object.keys(translations).length > 0, {
      message: 'Se requiere al menos una traducción',
    }),
  categories: z.array(z.number().int().positive()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
