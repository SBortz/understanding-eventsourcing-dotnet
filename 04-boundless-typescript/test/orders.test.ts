import { describe, it, expect } from 'vitest';
import type { ShoppingEvent } from '../src/domain/events.js';
import { projectOrders } from '../src/slices/orders.js';

describe('OrdersProjector', () => {
  it('projects orders from CartSubmitted events', () => {
    const events: ShoppingEvent[] = [
      {
        type: 'CartSubmitted',
        data: {
          cartId: 'cart-1',
          orderedProducts: [
            { productId: 'prod-a', totalPrice: 29.99 },
            { productId: 'prod-b', totalPrice: 49.99 },
          ],
        },
      },
      {
        type: 'CartSubmitted',
        data: {
          cartId: 'cart-2',
          orderedProducts: [
            { productId: 'prod-c', totalPrice: 19.99 },
          ],
        },
      },
    ];

    const orders = projectOrders(events);

    expect(orders).toHaveLength(2);

    expect(orders[0].cartId).toBe('cart-1');
    expect(orders[0].orderedProducts).toHaveLength(2);
    expect(orders[0].totalPrice).toBeCloseTo(79.98);

    expect(orders[1].cartId).toBe('cart-2');
    expect(orders[1].orderedProducts).toHaveLength(1);
    expect(orders[1].totalPrice).toBeCloseTo(19.99);
  });

  it('returns empty when no submissions', () => {
    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId: 'cart-1' } },
      {
        type: 'ItemAdded',
        data: {
          cartId: 'cart-1',
          itemId: 'item-1',
          productId: 'prod-a',
          description: 'Test',
          image: '',
          price: 10,
        },
      },
    ];

    const orders = projectOrders(events);
    expect(orders).toHaveLength(0);
  });
});
