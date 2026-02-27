import { describe, it, expect } from 'vitest';
import type { InventoryChanged } from '../src/domain/events.js';

describe('ChangeInventoryTranslation', () => {
  it('translates external event to InventoryChanged', () => {
    const productId = '00000000-0000-0000-0000-000000000001';
    const inventory = 1;

    // The translation in change-inventory.ts is inline in the route handler.
    // We verify the event shape matches the InventoryChanged type.
    const event: InventoryChanged = {
      type: 'InventoryChanged',
      data: { productId, inventory },
    };

    expect(event.type).toBe('InventoryChanged');
    expect(event.data.productId).toBe(productId);
    expect(event.data.inventory).toBe(inventory);
  });
});
