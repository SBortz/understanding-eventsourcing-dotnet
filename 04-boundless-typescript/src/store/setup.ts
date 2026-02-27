// BoundlessDB Event Store setup

import { EventStore, SqliteStorage } from 'boundlessdb';
import type { ConsistencyConfig } from 'boundlessdb';

/**
 * Consistency config: defines which keys are extracted from each event type.
 *
 * DCB approach: instead of streams, we use keys to define consistency boundaries.
 * - cart: groups all events belonging to one cart (path: data.cartId)
 * - product: groups pricing/inventory events per product (path: data.productId)
 */
export const consistency: ConsistencyConfig = {
  eventTypes: {
    CartCreated: {
      keys: [{ name: 'cart', path: 'data.cartId' }],
    },
    ItemAdded: {
      keys: [
        { name: 'cart', path: 'data.cartId' },
        { name: 'product', path: 'data.productId' },
      ],
    },
    ItemRemoved: {
      keys: [{ name: 'cart', path: 'data.cartId' }],
    },
    ItemArchived: {
      keys: [{ name: 'cart', path: 'data.cartId' }],
    },
    ItemQuantityChanged: {
      keys: [{ name: 'cart', path: 'data.cartId' }],
    },
    CartSubmitted: {
      keys: [{ name: 'cart', path: 'data.cartId' }],
    },
    CartCleared: {
      keys: [{ name: 'cart', path: 'data.cartId' }],
    },
    CartPublished: {
      keys: [{ name: 'cart', path: 'data.cartId' }],
    },
    CartPublicationFailed: {
      keys: [{ name: 'cart', path: 'data.cartId' }],
    },
    InventoryChanged: {
      keys: [{ name: 'product', path: 'data.productId' }],
    },
    PriceChanged: {
      keys: [{ name: 'product', path: 'data.productId' }],
    },
  },
};

let storeInstance: EventStore | null = null;

export function getStore(): EventStore {
  if (!storeInstance) {
    const storage = new SqliteStorage('./shopping-cart.db');
    storeInstance = new EventStore({ storage, consistency });
  }
  return storeInstance;
}

export function closeStore() {
  if (storeInstance) {
    storeInstance.close();
    storeInstance = null;
  }
}
