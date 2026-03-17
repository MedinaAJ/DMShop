import type { PaymentModule } from './payment.interface.js';

class PaymentRegistry {
  private readonly modules = new Map<string, PaymentModule>();

  register(module: PaymentModule): void {
    this.modules.set(module.name, module);
  }

  get(name: string): PaymentModule | undefined {
    return this.modules.get(name);
  }

  async getAvailable(): Promise<PaymentModule[]> {
    const available: PaymentModule[] = [];
    for (const mod of this.modules.values()) {
      if (await mod.isAvailable()) {
        available.push(mod);
      }
    }
    return available;
  }

  getAll(): PaymentModule[] {
    return Array.from(this.modules.values());
  }
}

export const paymentRegistry = new PaymentRegistry();
