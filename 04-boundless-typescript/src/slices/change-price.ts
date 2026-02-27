import type { ShoppingEvent } from '../domain/events.js';
import { buildState } from '../domain/cart.js';
import { getStore } from '../store/setup.js';
import {
  readAllEvents,
  readCartEvents,
  readEventsByType,
} from '../store/helpers.js';

// ---------------------------------------------------------------------------
// Translation: external PriceChanged → internal PriceChanged (blind append)
// ---------------------------------------------------------------------------

export function translatePriceChanged(body: {
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
      const store = await getStore();
      await store.append(
        archiveEvents.map((e) => ({ type: e.type, data: e.data as Record<string, unknown> })),
        null,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Projection: current prices
// ---------------------------------------------------------------------------

/**
 * Build a map of productId → latest newPrice from all PriceChanged events.
 */
export function projectCurrentPrices(
  events: ShoppingEvent[],
): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const e of events) {
    if (e.type === 'PriceChanged') {
      prices[e.data.productId] = e.data.newPrice;
    }
  }
  return prices;
}

// ---------------------------------------------------------------------------
// Usecases
// ---------------------------------------------------------------------------

export interface ChangePriceCommand {
  productId: string;
  oldPrice: number;
  newPrice: number;
}

export async function executeChangePrice(command: ChangePriceCommand): Promise<{ success: boolean; event: ShoppingEvent }> {
  // 1. Translate & blind-append PriceChanged event
  const event = translatePriceChanged(command);
  const store = await getStore();
  await store.append([{ type: event.type, data: event.data as Record<string, unknown> }], null);

  // 2. Run archive processor
  await runArchiveProcessor();

  return { success: true, event };
}

export async function getPrices(): Promise<Record<string, number>> {
  const events = await readEventsByType('PriceChanged');
  return projectCurrentPrices(events);
}
