import { z } from 'zod';

export const createOrderSchema = z.object({
  idAddressDelivery: z.number().int().positive(),
  idAddressInvoice: z.number().int().positive().optional(),
  idCarrier: z.number().int().positive(),
  paymentMethod: z.string().min(1).max(64),
  note: z.string().max(500).optional(),
});

export const updateOrderStateSchema = z.object({
  idOrderState: z.number().int().positive(),
  comment: z.string().max(500).optional(),
});

export const registerPaymentSchema = z.object({
  paymentMethod: z.string().min(1).max(64),
  transactionId: z.string().max(255).optional(),
  amount: z.number().positive(),
  idCurrency: z.number().int().positive(),
});

export const updateTrackingSchema = z.object({
  trackingNumber: z.string().min(1).max(64),
});

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  state: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  q: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStateInput = z.infer<typeof updateOrderStateSchema>;
export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>;
export type UpdateTrackingInput = z.infer<typeof updateTrackingSchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
