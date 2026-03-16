import { EventEmitter } from 'events';
import { logger } from '../config/logger.js';

class EventBus extends EventEmitter {
  async emitAsync(event: string, ...args: unknown[]): Promise<void> {
    const listeners = this.listeners(event);
    for (const listener of listeners) {
      try {
        await (listener as (...a: unknown[]) => Promise<void>)(...args);
      } catch (error) {
        logger.error(`Error in hook "${event}":`, error);
      }
    }
  }
}

export const eventBus = new EventBus();
eventBus.setMaxListeners(50);
