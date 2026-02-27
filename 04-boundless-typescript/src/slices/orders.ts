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

export async function getOrders(): Promise<Order[]> {
  const events = await readEventsByType('CartSubmitted');
  return projectOrders(events);
}
