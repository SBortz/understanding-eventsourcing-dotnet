import { describe, it, expect } from 'vitest';
import { buildState } from '../src/domain/cart.js';
import type { ShoppingEvent } from '../src/domain/events.js';
import { addItemDecider, type AddItemCommand } from '../src/slices/add-item.js';

describe('AddItemDecider', () => {
  it('CartSessionCreatedAutomatically', () => {
    const cartId = '00000000-0000-0000-0000-000000000001';
    const events: ShoppingEvent[] = [];
    const state = buildState(events);

    const command: AddItemCommand = {
      cartId,
      itemId: crypto.randomUUID(),
      productId: crypto.randomUUID(),
      description: 'Description',
      image: 'Image',
      price: 10,
    };

    const uncommittedEvents = addItemDecider(state, command);

    expect(uncommittedEvents[0].type).toBe('CartCreated');
    expect(uncommittedEvents[1].type).toBe('ItemAdded');
  });

  it('AddsMaximum3Items', () => {
    const cartId = '00000000-0000-0000-0000-000000000001';
    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: crypto.randomUUID(), description: 'Description', image: 'Image', price: 10 } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: crypto.randomUUID(), description: 'Description', image: 'Image', price: 10 } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: crypto.randomUUID(), description: 'Description', image: 'Image', price: 10 } },
    ];
    const state = buildState(events);

    const command: AddItemCommand = {
      cartId,
      itemId: crypto.randomUUID(),
      productId: crypto.randomUUID(),
      description: 'Description',
      image: 'Image',
      price: 10,
    };

    expect(() => addItemDecider(state, command)).toThrow(/Too many items/);
  });
});
