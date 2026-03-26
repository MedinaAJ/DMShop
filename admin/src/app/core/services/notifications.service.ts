import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AdminNotification {
  id: string;
  type: 'new_order' | 'order_status_changed' | 'out_of_stock' | 'info';
  title: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService implements OnDestroy {
  readonly notifications = signal<AdminNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly connected = signal(false);

  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 3000;
  private readonly maxReconnectDelay = 30000;
  private shouldReconnect = true;

  private readonly WS_URL = (environment.apiUrl ?? 'http://localhost:3000/api/v1')
    .replace(/^http/, 'ws')
    .replace('/api/v1', '')
    + '/ws';

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.shouldReconnect = true;
    this.openConnection();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected.set(false);
  }

  private openConnection(): void {
    try {
      this.ws = new WebSocket(this.WS_URL);

      this.ws.onopen = () => {
        this.connected.set(true);
        this.reconnectDelay = 3000; // Reset backoff
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ping') return;
          this.addNotification(msg);
        } catch { /* ignore malformed */ }
      };

      this.ws.onclose = () => {
        this.connected.set(false);
        this.ws = null;
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.connected.set(false);
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) {
        this.openConnection();
      }
      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  private addNotification(event: { type: string; data: Record<string, unknown>; timestamp: string }): void {
    const notification = this.buildNotification(event);
    if (!notification) return;

    this.notifications.update((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50
    this.unreadCount.update((n) => n + 1);
  }

  private buildNotification(event: { type: string; data: Record<string, unknown>; timestamp: string }): AdminNotification | null {
    const id = crypto.randomUUID();
    const timestamp = event.timestamp;
    const data = event.data;

    switch (event.type) {
      case 'new_order':
        return {
          id,
          type: 'new_order',
          title: '¡Nuevo pedido!',
          message: `Pedido #${data['reference']} — ${Number(data['total']).toFixed(2)}€`,
          data,
          timestamp,
          read: false,
        };
      case 'order_status_changed':
        return {
          id,
          type: 'order_status_changed',
          title: 'Estado de pedido actualizado',
          message: `Pedido #${data['reference']} → ${data['newStateName']}`,
          data,
          timestamp,
          read: false,
        };
      case 'out_of_stock':
        return {
          id,
          type: 'out_of_stock',
          title: 'Sin stock',
          message: `Producto "${data['productName']}" se ha quedado sin stock`,
          data,
          timestamp,
          read: false,
        };
      default:
        return null;
    }
  }

  markAllRead(): void {
    this.notifications.update((prev) => prev.map((n) => ({ ...n, read: true })));
    this.unreadCount.set(0);
  }

  markRead(id: string): void {
    this.notifications.update((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    this.unreadCount.set(this.notifications().filter((n) => !n.read).length);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
