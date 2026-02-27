import { describe, it, expect } from 'vitest';
import { buildState } from '../src/domain/cart.js';
import type { ShoppingEvent } from '../src/domain/events.js';
import { submitCartDecider } from '../src/slices/submit-cart.js';

describe('SubmitCartDecider', () => {
  const cartId = '00000000-0000-0000-0000-000000000001';
  const productId1 = '00000000-0000-0000-0000-000000000002';
  const productId2 = '00000000-0000-0000-0000-000000000003';

  function buildInventories(inventoryEvents: ShoppingEvent[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const e of inventoryEvents) {
      if (e.type === 'InventoryChanged') {
        map.set(e.data.productId, e.data.inventory);
      }
    }
    return map;
  }

  it('CantSubmitNoProductsInStock', () => {
    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: productId1, description: 'Description', image: 'Image', price: 10 } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: productId2, description: 'Description', image: 'Image', price: 10 } },
    ];
    const state = buildState(events);
    const inventories = buildInventories([]);

    expect(() =>
      submitCartDecider(state, inventories, {
        cartId,
        orderedProducts: [
          { productId: productId1, totalPrice: 10 },
          { productId: productId2, totalPrice: 5 },
        ],
      }),
    ).toThrow(/out of stock/);
  });

  it('CantSubmitNoQuantity', () => {
    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: productId1, description: 'Description', image: 'Image', price: 10 } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: productId2, description: 'Description', image: 'Image', price: 10 } },
    ];
    const state = buildState(events);
    const inventories = buildInventories([
      { type: 'InventoryChanged', data: { productId: productId1, inventory: 0 } },
      { type: 'InventoryChanged', data: { productId: productId2, inventory: 0 } },
    ]);

    expect(() =>
      submitCartDecider(state, inventories, {
        cartId,
        orderedProducts: [
          { productId: productId1, totalPrice: 10 },
          { productId: productId2, totalPrice: 5 },
        ],
      }),
    ).toThrow(/out of stock/);
  });

  it('CantSubmitCartTwice', () => {
    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: productId1, description: 'Description', image: 'Image', price: 10 } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: productId2, description: 'Description', image: 'Image', price: 10 } },
      { type: 'CartSubmitted', data: { cartId, orderedProducts: [{ productId: productId1, totalPrice: 10 }, { productId: productId2, totalPrice: 10 }] } },
    ];
    const state = buildState(events);
    const inventories = buildInventories([
      { type: 'InventoryChanged', data: { productId: productId1, inventory: 1 } },
      { type: 'InventoryChanged', data: { productId: productId2, inventory: 1 } },
    ]);

    expect(() =>
      submitCartDecider(state, inventories, {
        cartId,
        orderedProducts: [
          { productId: productId1, totalPrice: 10 },
          { productId: productId2, totalPrice: 5 },
        ],
      }),
    ).toThrow(/already been submitted/);
  });

  it('ShouldSubmit', () => {
    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: productId1, description: 'Description', image: 'Image', price: 10 } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: productId2, description: 'Description', image: 'Image', price: 10 } },
    ];
    const state = buildState(events);
    const inventories = buildInventories([
      { type: 'InventoryChanged', data: { productId: productId1, inventory: 1 } },
      { type: 'InventoryChanged', data: { productId: productId2, inventory: 2 } },
    ]);

    const uncommittedEvents = submitCartDecider(state, inventories, {
      cartId,
      orderedProducts: [
        { productId: productId1, totalPrice: 10 },
        { productId: productId2, totalPrice: 5 },
      ],
    });

    expect(uncommittedEvents[uncommittedEvents.length - 1].type).toBe('CartSubmitted');
  });

  it('SubmitEmptyCartFails', () => {
    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: productId1, description: 'Description', image: 'Image', price: 10 } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: productId2, description: 'Description', image: 'Image', price: 10 } },
      { type: 'CartCleared', data: { cartId } },
    ];
    const state = buildState(events);
    const inventories = buildInventories([
      { type: 'InventoryChanged', data: { productId: productId1, inventory: 1 } },
      { type: 'InventoryChanged', data: { productId: productId2, inventory: 2 } },
    ]);

    expect(() =>
      submitCartDecider(state, inventories, {
        cartId,
        orderedProducts: [],
      }),
    ).toThrow(/empty cart/);
  });
});
