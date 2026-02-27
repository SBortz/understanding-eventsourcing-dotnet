import type { ShoppingEvent } from '../domain/events.js';
import { readAllEvents } from '../store/helpers.js';

export interface ProductInCart {
  cartId: string;
  productId: string;
}

export function projectCartsWithProducts(events: ShoppingEvent[]): ProductInCart[] {
  // itemId -> { cartId, productId } so we can resolve removals by itemId
  const itemMap = new Map<string, { cartId: string; productId: string }>();

  for (const event of events) {
    switch (event.type) {
      case 'ItemAdded':
        itemMap.set(event.data.itemId, {
          cartId: event.data.cartId,
          productId: event.data.productId,
        });
        break;

      case 'ItemRemoved':
        itemMap.delete(event.data.itemId);
        break;

      case 'ItemArchived':
        itemMap.delete(event.data.itemId);
        break;

      case 'CartCleared': {
        const cartId = event.data.cartId;
        for (const [itemId, entry] of itemMap) {
          if (entry.cartId === cartId) {
            itemMap.delete(itemId);
          }
        }
        break;
      }
    }
  }

  // Deduplicate: one entry per unique { cartId, productId }
  const seen = new Set<string>();
  const result: ProductInCart[] = [];

  for (const { cartId, productId } of itemMap.values()) {
    const key = `${cartId}:${productId}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ cartId, productId });
    }
  }

  return result;
}

export async function getCartsWithProducts(): Promise<ProductInCart[]> {
  const events = await readAllEvents();
  return projectCartsWithProducts(events);
}
