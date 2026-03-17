import { z } from 'zod';

export const createManufacturerSchema = z.object({
  name: z.string().min(1).max(128),
  active: z.boolean().optional().default(true),
});

export const updateManufacturerSchema = createManufacturerSchema.partial();

export type CreateManufacturerInput = z.infer<typeof createManufacturerSchema>;
export type UpdateManufacturerInput = z.infer<typeof updateManufacturerSchema>;

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(128),
  active: z.boolean().optional().default(true),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
