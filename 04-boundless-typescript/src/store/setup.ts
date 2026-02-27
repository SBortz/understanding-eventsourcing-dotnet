// BoundlessDB Event Store setup

import { EventStore } from 'boundlessdb';
import type { ConsistencyConfig, StorageInterface } from 'boundlessdb';

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
let storagePromise: Promise<StorageInterface> | null = null;

async function createStorage(): Promise<StorageInterface> {
  const pgUrl = process.env.POSTGRES_URL;
  if (pgUrl) {
    // Dynamic import: avoids loading better-sqlite3 on Vercel
    const { PostgresStorage } = await import('boundlessdb');
    return new PostgresStorage(pgUrl);
  } else {
    const { SqliteStorage } = await import('boundlessdb');
    return new SqliteStorage('./shopping-cart.db');
  }
}

export async function getStore(): Promise<EventStore> {
  if (!storeInstance) {
    if (!storagePromise) storagePromise = createStorage();
    const storage = await storagePromise;
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
