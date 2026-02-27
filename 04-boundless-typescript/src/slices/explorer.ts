import { ALL_EVENT_TYPES } from '../domain/events.js';
import { getStore, consistency } from '../store/setup.js';
import { projectOrders } from './orders.js';
import { projectCurrentPrices } from './change-price.js';
import { projectCartsWithProducts } from './carts-with-products.js';
import { projectCartItems } from './cart-items.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((o: unknown, key: string) => (o as Record<string, unknown>)?.[key], obj);
}

// ---------------------------------------------------------------------------
// Usecases
// ---------------------------------------------------------------------------

export async function getDebugEvents(limit = 100) {
  const store = await getStore();
  const result = await store.read({
    conditions: ALL_EVENT_TYPES.map(type => ({ type })),
  });

  // Take only the last N events (newest first for display)
  const latest = result.events.slice(-limit);

  return { total: result.events.length, events: latest.map(e => {
    // Extract keys from consistency config
    const config = consistency.eventTypes[e.type];
    const keys: Array<{ name: string; value: string }> = [];
    if (config?.keys) {
      for (const keyDef of config.keys) {
        const value = getNestedValue(e, keyDef.path);
        if (value !== undefined) {
          keys.push({ name: keyDef.name, value: String(value) });
        }
      }
    }

    return {
      position: Number(e.position),
      type: e.type,
      data: e.data,
      keys,
      timestamp: e.timestamp,
    };
  }) };
}

export async function getDebugState(cartLimit = 50, orderLimit = 50) {
  const store = await getStore();
  const result = await store.read({
    conditions: ALL_EVENT_TYPES.map(type => ({ type })),
  });

  const allTyped = result.events.map(e => ({ type: e.type, data: e.data }) as any);

  // InventoriesSV
  const inventories: Record<string, number> = {};
  for (const e of result.events) {
    if (e.type === 'InventoryChanged') {
      const data = e.data as Record<string, unknown>;
      inventories[data.productId as string] = data.inventory as number;
    }
  }

  // OrdersSV
  const orders = projectOrders(allTyped);

  // ChangedPricesSV
  const prices = projectCurrentPrices(allTyped);

  // CartsWithProductsSV
  const cartsWithProducts = projectCartsWithProducts(allTyped);

  // CartItemsStateView per cart (track last event position for sort order)
  const cartLastPosition = new Map<string, number>();
  for (let i = 0; i < result.events.length; i++) {
    const data = result.events[i].data as Record<string, unknown>;
    if (data.cartId) {
      cartLastPosition.set(data.cartId as string, Number(result.events[i].position));
    }
  }

  const carts: Record<string, unknown> = {};
  for (const [cartId, lastPos] of cartLastPosition) {
    const cartEvts = allTyped.filter((e: any) => e.data.cartId === cartId);
    const view = projectCartItems(cartEvts);
    const isSubmitted = cartEvts.some((e: any) => e.type === 'CartSubmitted');
    carts[cartId] = { ...view, isSubmitted, lastPosition: lastPos };
  }

  // Limit orders (newest last in array, so slice from end)
  const limitedOrders = orders.slice(-orderLimit);

  // Limit carts: sort by lastPosition desc, take first N
  const sortedCartEntries = Object.entries(carts)
    .sort(([, a]: any, [, b]: any) => b.lastPosition - a.lastPosition)
    .slice(0, cartLimit);
  const limitedCarts = Object.fromEntries(sortedCartEntries);

  return {
    inventories,
    orders: limitedOrders,
    totalOrders: orders.length,
    prices,
    cartsWithProducts,
    carts: limitedCarts,
    totalCarts: Object.keys(carts).length,
    totalEvents: result.events.length,
  };
}
