import { z } from 'zod';

export const createCartRuleSchema = z.object({
  code: z.string().min(3).max(64).optional(),
  name: z.string().min(1).max(128),
  description: z.string().max(1000).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  quantity: z.number().int().min(0).default(1),
  quantityPerUser: z.number().int().min(0).default(1),
  priority: z.number().int().min(0).default(1),
  minimumAmount: z.number().min(0).default(0),
  minimumAmountCurrency: z.number().int().positive().optional(),
  freeShipping: z.boolean().default(false),
  reductionPercent: z.number().min(0).max(100).default(0),
  reductionAmount: z.number().min(0).default(0),
  reductionCurrency: z.number().int().positive().optional(),
  idCustomer: z.number().int().positive().optional(),
  active: z.boolean().default(true),
});

export const updateCartRuleSchema = createCartRuleSchema.partial();

export const applyCartRuleSchema = z.object({
  code: z.string().min(1).max(64),
});

export const createSpecificPriceSchema = z.object({
  idProduct: z.number().int().positive(),
  idCombination: z.number().int().positive().optional(),
  idCustomer: z.number().int().positive().optional(),
  idCustomerGroup: z.number().int().positive().optional(),
  idCurrency: z.number().int().positive().optional(),
  idCountry: z.number().int().positive().optional(),
  fromQuantity: z.number().int().min(1).default(1),
  price: z.number().default(-1),
  reduction: z.number().min(0).default(0),
  reductionType: z.enum(['percentage', 'amount']).default('percentage'),
  reductionTax: z.boolean().default(true),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const updateSpecificPriceSchema = createSpecificPriceSchema.partial().omit({ idProduct: true });

export type CreateCartRuleInput = z.infer<typeof createCartRuleSchema>;
export type UpdateCartRuleInput = z.infer<typeof updateCartRuleSchema>;
export type ApplyCartRuleInput = z.infer<typeof applyCartRuleSchema>;
export type CreateSpecificPriceInput = z.infer<typeof createSpecificPriceSchema>;
export type UpdateSpecificPriceInput = z.infer<typeof updateSpecificPriceSchema>;
