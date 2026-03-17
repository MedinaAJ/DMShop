import { z } from 'zod';

export const createCarrierSchema = z.object({
  name: z.string().min(1).max(64),
  idTaxRulesGroup: z.number().int().positive().nullable().optional(),
  url: z.string().max(255).nullable().optional(),
  active: z.boolean().optional().default(true),
  isFree: z.boolean().optional().default(false),
  shippingMethod: z.enum(['weight', 'price']).optional().default('price'),
  maxWidth: z.number().int().min(0).optional().default(0),
  maxHeight: z.number().int().min(0).optional().default(0),
  maxDepth: z.number().int().min(0).optional().default(0),
  maxWeight: z.number().min(0).optional().default(0),
  grade: z.number().int().min(0).optional().default(0),
  delay: z.number().int().min(0).optional().default(0),
  zones: z.array(z.number().int().positive()).optional(),
  ranges: z
    .array(
      z.object({
        delimiter1: z.number().min(0),
        delimiter2: z.number().min(0),
        prices: z.array(
          z.object({
            idZone: z.number().int().positive(),
            price: z.number().min(0),
          }),
        ),
      }),
    )
    .optional(),
});

export const updateCarrierSchema = createCarrierSchema.partial();

export type CreateCarrierInput = z.infer<typeof createCarrierSchema>;
export type UpdateCarrierInput = z.infer<typeof updateCarrierSchema>;
