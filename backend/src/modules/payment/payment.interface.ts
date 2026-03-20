import type { Order } from '../../models/order.model.js';

/**
 * Result returned after processing a payment
 */
export interface PaymentResult {
  /** Whether the payment was completed inline (e.g. bank transfer = awaiting, Stripe = redirect) */
  status: 'completed' | 'pending' | 'redirect';
  /** For redirect-based payments (Stripe, Redsys) */
  redirectUrl?: string;
  /** Transaction ID from the external provider */
  transactionId?: string;
  /** Additional data to store or return to the client */
  metadata?: Record<string, unknown>;
}

/**
 * Interface every payment module must implement
 */
export interface PaymentModule {
  /** Internal unique key (e.g. 'bank_transfer', 'stripe') */
  name: string;
  /** Human-readable label for the storefront */
  displayName: string;
  /** Brief description */
  description: string;
  /** Material icon name */
  icon: string;
  /** Whether this module requires external configuration to work */
  requiresConfig: boolean;

  /**
   * Countries where this method is available (ISO-3166 alpha-2 codes, e.g. ['ES', 'PT']).
   * Empty array or undefined means available in all countries.
   */
  allowedCountries?: string[];

  /**
   * Customer group IDs that can use this payment method.
   * Empty array or undefined means available to all groups.
   */
  allowedGroups?: number[];

  /**
   * Surcharge applied as a percentage of the order total (e.g. 3 = 3%).
   * Only applied when > 0.
   */
  surchargePercent?: number;

  /**
   * Surcharge applied as a fixed amount added to the order total (in the store currency).
   * Only applied when > 0.
   */
  surchargeAmount?: number;

  /**
   * Check whether this payment method is currently available
   * (e.g. Stripe API key configured, module enabled in admin)
   */
  isAvailable(): Promise<boolean>;

  /**
   * Process the payment after the order has been created.
   * For offline methods: simply return { status: 'pending' }.
   * For online methods: create a session / payment intent and return redirect URL.
   */
  process(order: Order, paymentData?: Record<string, unknown>): Promise<PaymentResult>;

  /**
   * Handle a webhook / callback from the payment provider.
   * Returns the transaction ID and whether payment was successful.
   */
  handleWebhook?(payload: unknown, headers: Record<string, string>): Promise<{
    orderId: number;
    transactionId: string;
    amount: number;
    success: boolean;
  }>;
}

