import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { logger } from '../config/logger.js';

export type WsEventType = 'new_order' | 'order_status_changed' | 'out_of_stock' | 'ping';

export interface WsEvent {
  type: WsEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

let wss: WebSocketServer | null = null;

// Admin clients only
const adminClients = new Set<WebSocket>();

export function initWebSocket(server: import('http').Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    logger.info(`WebSocket client connected from ${req.socket.remoteAddress}`);
    adminClients.add(ws);

    // Send a welcome ping
    ws.send(JSON.stringify({ type: 'ping', data: { message: 'Connected to DMShop admin notifications' }, timestamp: new Date().toISOString() }));

    // Heartbeat
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('pong', () => {
      // Client is alive
    });

    ws.on('close', () => {
      adminClients.delete(ws);
      clearInterval(interval);
      logger.info('WebSocket client disconnected');
    });

    ws.on('error', (err) => {
      logger.error('WebSocket error:', err);
      adminClients.delete(ws);
      clearInterval(interval);
    });
  });

  logger.info('WebSocket server initialized at /ws');
}

export function broadcastToAdmins(event: WsEvent): void {
  if (adminClients.size === 0) return;

  const message = JSON.stringify(event);
  for (const client of adminClients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (e) {
        logger.error('Failed to send WebSocket message:', e);
        adminClients.delete(client);
      }
    }
  }
}

export function emitNewOrder(orderId: number, reference: string, total: number, customerEmail: string): void {
  broadcastToAdmins({
    type: 'new_order',
    data: { orderId, reference, total, customerEmail },
    timestamp: new Date().toISOString(),
  });
}

export function emitOrderStatusChanged(orderId: number, reference: string, newStateId: number, newStateName: string): void {
  broadcastToAdmins({
    type: 'order_status_changed',
    data: { orderId, reference, newStateId, newStateName },
    timestamp: new Date().toISOString(),
  });
}

export function emitOutOfStock(productId: number, productName: string): void {
  broadcastToAdmins({
    type: 'out_of_stock',
    data: { productId, productName },
    timestamp: new Date().toISOString(),
  });
}
