import { z } from 'zod';

export const createAddressSchema = z.object({
  idCountry: z.number().int().positive(),
  idState: z.number().int().positive().nullable().optional(),
  alias: z.string().min(1).max(32),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  company: z.string().max(100).nullable().optional(),
  address1: z.string().min(1).max(255),
  address2: z.string().max(255).nullable().optional(),
  city: z.string().min(1).max(64),
  postcode: z.string().min(1).max(12),
  phone: z.string().max(32).nullable().optional(),
  phoneMobile: z.string().max(32).nullable().optional(),
  vatNumber: z.string().max(32).nullable().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
