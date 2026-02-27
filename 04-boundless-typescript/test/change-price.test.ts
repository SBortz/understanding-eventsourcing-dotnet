import { describe, it, expect } from 'vitest';
import { translatePriceChanged } from '../src/slices/change-price.js';

describe('ChangePriceTranslation', () => {
  it('translates external event to PriceChanged', () => {
    const productId = '00000000-0000-0000-0000-000000000001';

    const event = translatePriceChanged({
      productId,
      oldPrice: 20,
      newPrice: 25,
    });

    expect(event.type).toBe('PriceChanged');
    expect(event.data).toEqual({
      productId,
      oldPrice: 20,
      newPrice: 25,
    });
  });
});
