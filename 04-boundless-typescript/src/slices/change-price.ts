import type { Express } from 'express';
import type { ShoppingEvent } from '../domain/events.js';
import { buildState } from '../domain/cart.js';
import { getStore } from '../store/setup.js';
import {
  readAllEvents,
  readCartEvents,
  readEventsByType,
  appendCartEvents,
} from '../store/helpers.js';

// ---------------------------------------------------------------------------
// Translation: external PriceChanged → internal PriceChanged (blind append)
// ---------------------------------------------------------------------------

function translatePriceChanged(body: {
  productId: string;
  oldPrice: number;
  newPrice: number;
}): ShoppingEvent {
  return {
    type: 'PriceChanged',
    data: {
      productId: body.productId,
      oldPrice: body.oldPrice,
      newPrice: body.newPrice,
    },
  };
}

// ---------------------------------------------------------------------------
// Processor: archive items whose price has changed
// ---------------------------------------------------------------------------

interface PriceInfo {
  oldPrice: number;
  newPrice: number;
}

/**
 * Build a map of productId → latest price change from all PriceChanged events.
 */
function buildChangedPricesMap(
  events: ShoppingEvent[],
): Map<string, PriceInfo> {
  const map = new Map<string, PriceInfo>();
  for (const e of events) {
    if (e.type === 'PriceChanged') {
      map.set(e.data.productId, {
        oldPrice: e.data.oldPrice,
        newPrice: e.data.newPrice,
      });
    }
  }
  return map;
}

/**
 * Scan all events and find which carts currently contain products whose price
 * has changed. Returns a map of cartId → Set<productId>.
 */
function findAffectedCarts(
  allEvents: ShoppingEvent[],
  changedProductIds: Set<string>,
): Map<string, Set<string>> {
  // Track itemId → { cartId, productId } (like CartsWithProducts)
  const itemMap = new Map<string, { cartId: string; productId: string }>();

  for (const event of allEvents) {
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
    }
  }

  // Collect carts that have items with changed-price products
  const affected = new Map<string, Set<string>>();
  for (const { cartId, productId } of itemMap.values()) {
    if (changedProductIds.has(productId)) {
      let products = affected.get(cartId);
      if (!products) {
        products = new Set<string>();
        affected.set(cartId, products);
      }
      products.add(productId);
    }
  }
  return affected;
}

/**
 * For each affected cart, rebuild state, find the itemIds that match the
 * changed products, and emit ItemArchived events.
 */
async function runArchiveProcessor(): Promise<void> {
  // 1. Read all PriceChanged events → map of changed products
  const priceEvents = await readEventsByType('PriceChanged');
  const changedPrices = buildChangedPricesMap(priceEvents);

  if (changedPrices.size === 0) return;

  // 2. Read ALL events → find carts containing those products
  const allEvents = await readAllEvents();
  const affectedCarts = findAffectedCarts(allEvents, new Set(changedPrices.keys()));

  // 3. For each affected cart: load state, emit ItemArchived for matching items
  for (const [cartId, affectedProductIds] of affectedCarts) {
    const cartEvents = await readCartEvents(cartId);
    const state = buildState(cartEvents);

    const archiveEvents: ShoppingEvent[] = [];

    for (const [itemId, productId] of state.cartItems) {
      if (affectedProductIds.has(productId)) {
        archiveEvents.push({
          type: 'ItemArchived',
          data: { cartId, itemId },
        });
      }
    }

    if (archiveEvents.length > 0) {
      // Blind append (no concurrency guard)
      const store = getStore();
      await store.append(
        archiveEvents.map((e) => ({ type: e.type, data: e.data as Record<string, unknown> })),
        null,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export function changePriceRoutes(app: Express): void {
  app.post('/debug/simulate-price-changed', async (req, res) => {
    try {
      const { productId, oldPrice, newPrice } = req.body;

      // 1. Translate & blind-append PriceChanged event
      const event = translatePriceChanged({ productId, oldPrice, newPrice });
      const store = getStore();
      await store.append([{ type: event.type, data: event.data as Record<string, unknown> }], null);

      // 2. Run archive processor
      await runArchiveProcessor();

      res.status(200).json({ success: true, event });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });
}
