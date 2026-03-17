import { z } from 'zod';

export const createZoneSchema = z.object({
  name: z.string().min(1).max(64),
  active: z.boolean().optional().default(true),
});

export const updateZoneSchema = createZoneSchema.partial();

export const createCountrySchema = z.object({
  idZone: z.number().int().positive(),
  isoCode: z.string().length(2),
  name: z.string().min(1).max(64),
  active: z.boolean().optional().default(true),
  containsStates: z.boolean().optional().default(false),
});

export const updateCountrySchema = createCountrySchema.partial();

export const createStateSchema = z.object({
  idCountry: z.number().int().positive(),
  isoCode: z.string().min(1).max(7),
  name: z.string().min(1).max(64),
  active: z.boolean().optional().default(true),
});

export const updateStateSchema = createStateSchema.partial();

export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
export type CreateCountryInput = z.infer<typeof createCountrySchema>;
export type UpdateCountryInput = z.infer<typeof updateCountrySchema>;
export type CreateStateInput = z.infer<typeof createStateSchema>;
export type UpdateStateInput = z.infer<typeof updateStateSchema>;
