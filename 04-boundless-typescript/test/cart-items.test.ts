import { describe, it, expect } from 'vitest';
import type { ShoppingEvent } from '../src/domain/events.js';
import { projectCartItems } from '../src/slices/cart-items.js';

describe('CartItemsProjector', () => {
  it('IsEmptyInBeginning', () => {
    const cartId = '00000000-0000-0000-0000-000000000001';

    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
    ];

    const view = projectCartItems(events);

    expect(view.cartId).toBe(cartId);
    expect(view.items.length).toBe(0);
  });

  it('Has1Item', () => {
    const cartId = '00000000-0000-0000-0000-000000000001';
    const productId = '10000000-0000-0000-0000-000000000001';
    const itemId = '20000000-0000-0000-0000-000000000001';

    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
      { type: 'ItemAdded', data: { cartId, itemId, productId, description: 'Description', image: 'Image', price: 10 } },
    ];

    const view = projectCartItems(events);

    expect(view.cartId).toBe(cartId);
    expect(view.items.length).toBe(1);
    expect(view.items[0].itemId).toBe(itemId);
    expect(view.items[0].productId).toBe(productId);
  });

  it('QuantityChangeUpdatesTotalPrice', () => {
    const cartId = '00000000-0000-0000-0000-000000000001';
    const productId = '10000000-0000-0000-0000-000000000001';
    const itemId = '20000000-0000-0000-0000-000000000001';

    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
      { type: 'ItemAdded', data: { cartId, itemId, productId, description: 'Description', image: 'Image', price: 10 } },
      { type: 'ItemQuantityChanged', data: { cartId, itemId, newQuantity: 3 } },
    ];

    const view = projectCartItems(events);

    expect(view.items.length).toBe(1);
    expect(view.items[0].quantity).toBe(3);
    expect(view.totalPrice).toBe(30); // 10 * 3
  });

  it('Has2Items', () => {
    const cartId = '00000000-0000-0000-0000-000000000001';
    const productId1 = '10000000-0000-0000-0000-000000000001';
    const itemId1 = '20000000-0000-0000-0000-000000000001';
    const productId2 = '10000000-0000-0000-0000-000000000002';
    const itemId2 = '20000000-0000-0000-0000-000000000002';

    const events: ShoppingEvent[] = [
      { type: 'CartCreated', data: { cartId } },
      { type: 'ItemAdded', data: { cartId, itemId: itemId1, productId: productId1, description: 'Description', image: 'Image', price: 10 } },
      { type: 'ItemAdded', data: { cartId, itemId: itemId2, productId: productId2, description: 'Description', image: 'Image', price: 10 } },
    ];

    const view = projectCartItems(events);

    expect(view.cartId).toBe(cartId);
    expect(view.items.length).toBe(2);
    expect(view.items[0].itemId).toBe(itemId1);
    expect(view.items[0].productId).toBe(productId1);
    expect(view.items[1].itemId).toBe(itemId2);
    expect(view.items[1].productId).toBe(productId2);
  });
});
