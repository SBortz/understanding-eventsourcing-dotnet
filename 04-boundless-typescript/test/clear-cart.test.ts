import { describe, it, expect } from 'vitest';
import { buildState } from '../src/domain/cart.js';
import type { ShoppingEvent } from '../src/domain/events.js';
import { clearCartDecider } from '../src/slices/clear-cart.js';

describe('ClearCartDecider', () => {
  it('ClearCartTest', () => {
    const cartId = '00000000-0000-0000-0000-000000000001';
    const itemId = '00000000-0000-0000-0000-000000000002';

    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
      { type: 'ItemAdded', data: { cartId, itemId, productId: crypto.randomUUID(), description: 'Description', image: 'Image', price: 10 } },
    ];
    const state = buildState(events);

    const uncommittedEvents = clearCartDecider(state, { cartId });

    expect(uncommittedEvents[0].type).toBe('CartCleared');
  });
});
