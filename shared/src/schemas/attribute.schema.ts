import { z } from 'zod';

const attributeTranslationSchema = z.object({
  name: z.string().min(1).max(128),
});

export const createAttributeSchema = z.object({
  position: z.number().int().min(0).optional().default(0),
  translations: z
    .record(z.string(), attributeTranslationSchema)
    .refine((t) => Object.keys(t).length > 0, { message: 'Se requiere al menos una traducción' }),
});

export const updateAttributeSchema = createAttributeSchema.partial();

const attributeValueTranslationSchema = z.object({
  name: z.string().min(1).max(128),
});

export const createAttributeValueSchema = z.object({
  color: z.string().max(7).nullable().optional(),
  position: z.number().int().min(0).optional().default(0),
  translations: z
    .record(z.string(), attributeValueTranslationSchema)
    .refine((t) => Object.keys(t).length > 0, { message: 'Se requiere al menos una traducción' }),
});

export const updateAttributeValueSchema = createAttributeValueSchema.partial();

export type CreateAttributeInput = z.infer<typeof createAttributeSchema>;
export type UpdateAttributeInput = z.infer<typeof updateAttributeSchema>;
export type CreateAttributeValueInput = z.infer<typeof createAttributeValueSchema>;
export type UpdateAttributeValueInput = z.infer<typeof updateAttributeValueSchema>;
