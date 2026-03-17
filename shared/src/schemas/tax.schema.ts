import { z } from 'zod';

export const createTaxSchema = z.object({
  rate: z.number().min(0).max(100),
  active: z.boolean().optional().default(true),
  name: z.string().min(1).max(64),
});

export const updateTaxSchema = createTaxSchema.partial();

export const createTaxRulesGroupSchema = z.object({
  name: z.string().min(1).max(64),
  active: z.boolean().optional().default(true),
});

export const updateTaxRulesGroupSchema = createTaxRulesGroupSchema.partial();

export const createTaxRuleSchema = z.object({
  idTaxRulesGroup: z.number().int().positive(),
  idCountry: z.number().int().positive(),
  idState: z.number().int().min(0).optional().default(0),
  idTax: z.number().int().positive(),
  behavior: z.number().int().min(0).max(2).optional().default(0),
});

export const updateTaxRuleSchema = createTaxRuleSchema.partial();

export type CreateTaxInput = z.infer<typeof createTaxSchema>;
export type UpdateTaxInput = z.infer<typeof updateTaxSchema>;
export type CreateTaxRulesGroupInput = z.infer<typeof createTaxRulesGroupSchema>;
export type UpdateTaxRulesGroupInput = z.infer<typeof updateTaxRulesGroupSchema>;
export type CreateTaxRuleInput = z.infer<typeof createTaxRuleSchema>;
export type UpdateTaxRuleInput = z.infer<typeof updateTaxRuleSchema>;
