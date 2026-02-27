import type { Express } from 'express';
import type { ShoppingEvent } from '../domain/events.js';
import { readEventsByType } from '../store/helpers.js';

export interface Order {
  cartId: string;
  orderedProducts: Array<{ productId: string; totalPrice: number }>;
  totalPrice: number;
}

export function projectOrders(events: ShoppingEvent[]): Order[] {
  const orders: Order[] = [];

  for (const event of events) {
    if (event.type === 'CartSubmitted') {
      const d = event.data;
      const total = d.orderedProducts.reduce((sum, p) => sum + p.totalPrice, 0);
      orders.push({
        cartId: d.cartId,
        orderedProducts: d.orderedProducts,
        totalPrice: total,
      });
    }
  }

  return orders;
}

export function ordersRoutes(app: Express): void {
  app.get('/orders', async (_req, res) => {
    try {
      const events = await readEventsByType('CartSubmitted');
      const orders = projectOrders(events);
      res.status(200).json(orders);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  });
}
