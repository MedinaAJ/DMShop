import { z } from 'zod';

const featureTranslationSchema = z.object({
  name: z.string().min(1).max(128),
});

export const createFeatureSchema = z.object({
  position: z.number().int().min(0).optional().default(0),
  translations: z
    .record(z.string(), featureTranslationSchema)
    .refine((t) => Object.keys(t).length > 0, { message: 'Se requiere al menos una traducción' }),
});

export const updateFeatureSchema = createFeatureSchema.partial();

const featureValueTranslationSchema = z.object({
  value: z.string().min(1).max(255),
});

export const createFeatureValueSchema = z.object({
  custom: z.boolean().optional().default(false),
  translations: z
    .record(z.string(), featureValueTranslationSchema)
    .refine((t) => Object.keys(t).length > 0, { message: 'Se requiere al menos una traducción' }),
});

export const updateFeatureValueSchema = createFeatureValueSchema.partial();

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
export type CreateFeatureValueInput = z.infer<typeof createFeatureValueSchema>;
export type UpdateFeatureValueInput = z.infer<typeof updateFeatureValueSchema>;
