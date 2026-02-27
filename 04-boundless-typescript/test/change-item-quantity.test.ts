import { describe, it, expect } from 'vitest';
import type { ShoppingEvent } from '../src/domain/events.js';
import { buildState } from '../src/domain/cart.js';
import { changeItemQuantityDecider } from '../src/slices/change-item-quantity.js';

describe('ChangeItemQuantityDecider', () => {
  const cartId = '00000000-0000-0000-0000-000000000001';
  const itemId = '20000000-0000-0000-0000-000000000001';
  const productId = '10000000-0000-0000-0000-000000000001';

  function buildCartWithItem(): ShoppingEvent[] {
    return [
      { type: 'CartCreated', data: { cartId } },
      {
        type: 'ItemAdded',
        data: { cartId, itemId, productId, description: 'Test', image: '', price: 10 },
      },
    ];
  }

  it('successfully changes quantity', () => {
    const events = buildCartWithItem();
    const state = buildState(events);

    const result = changeItemQuantityDecider(state, { cartId, itemId, newQuantity: 3 });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('ItemQuantityChanged');
    expect(result[0].data).toEqual({ cartId, itemId, newQuantity: 3 });
  });

  it('rejects quantity less than 1', () => {
    const events = buildCartWithItem();
    const state = buildState(events);

    expect(() =>
      changeItemQuantityDecider(state, { cartId, itemId, newQuantity: 0 }),
    ).toThrow('Quantity must be at least 1');
  });

  it('rejects non-existent item', () => {
    const events = buildCartWithItem();
    const state = buildState(events);

    const fakeItemId = '99999999-0000-0000-0000-000000000001';

    expect(() =>
      changeItemQuantityDecider(state, { cartId, itemId: fakeItemId, newQuantity: 2 }),
    ).toThrow(`Item ${fakeItemId} not found in cart`);
  });
});
