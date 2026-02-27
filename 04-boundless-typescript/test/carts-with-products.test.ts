import { describe, it, expect } from 'vitest';
import type { ShoppingEvent } from '../src/domain/events.js';
import { projectCartsWithProducts } from '../src/slices/carts-with-products.js';

describe('CartsWithProductsProjector', () => {
  it('CartShouldContainProductIdOfAddedItem', () => {
    const cartId = '00000000-0000-0000-0000-000000000001';
    const productId = '00000000-0000-0000-0000-000000000002';

    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId, description: 'Description', image: 'Image', price: 10 } },
    ];

    const view = projectCartsWithProducts(events);

    expect(view.length).toBe(1);
    expect(view[0].cartId).toBe(cartId);
    expect(view[0].productId).toBe(productId);
  });

  it('ArchivedItemsShouldBeRemovedFromList', () => {
    const cartId = '00000000-0000-0000-0000-000000000001';
    const productId = '00000000-0000-0000-0000-000000000002';
    const itemId = '00000000-0000-0000-0000-000000000003';

    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
      { type: 'ItemAdded', data: { cartId, itemId, productId, description: 'Description', image: 'Image', price: 10 } },
      { type: 'ItemArchived', data: { cartId, itemId } },
    ];

    const view = projectCartsWithProducts(events);

    expect(view.length).toBe(0);
  });

  it('RemovedItemsShouldBeRemovedFromList', () => {
    const cartId = '00000000-0000-0000-0000-000000000001';
    const productId = '00000000-0000-0000-0000-000000000002';
    const itemId = '00000000-0000-0000-0000-000000000003';

    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
      { type: 'ItemAdded', data: { cartId, itemId, productId, description: 'Description', image: 'Image', price: 10 } },
      { type: 'ItemRemoved', data: { itemId, cartId } },
    ];

    const view = projectCartsWithProducts(events);

    expect(view.length).toBe(0);
  });

  it('CartClearedShouldRemoveItemsFromList', () => {
    const cartId = '00000000-0000-0000-0000-000000000001';

    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: crypto.randomUUID(), description: 'Description', image: 'Image', price: 10 } },
      { type: 'ItemAdded', data: { cartId, itemId: crypto.randomUUID(), productId: crypto.randomUUID(), description: 'Description', image: 'Image', price: 10 } },
      { type: 'CartCleared', data: { cartId } },
    ];

    const view = projectCartsWithProducts(events);

    expect(view.length).toBe(0);
  });
});
