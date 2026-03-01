// Helper functions for reading/writing events with BoundlessDB

import type { ShoppingEvent } from '../domain/events.js';
import { getStore } from './setup.js';

/**
 * Read all events for a specific cart (by cart key).
 * Uses matchKey — no need to list every event type manually.
 */
export async function readCartEvents(cartId: string): Promise<ShoppingEvent[]> {
  const store = await getStore();
  const result = await store.query<ShoppingEvent>()
    .matchKey('cart', cartId)
    .read();
  return result.events.map(toShoppingEvent);
}

/**
 * Read all events for a specific cart and return the appendCondition for concurrency.
 */
export async function readCartEventsWithCondition(cartId: string) {
  const store = await getStore();
  const result = await store.query<ShoppingEvent>()
    .matchKey('cart', cartId)
    .read();
  return {
    events: result.events.map(toShoppingEvent),
    appendCondition: result.appendCondition,
  };
}

/**
 * Read events by type across all keys (e.g. all InventoryChanged)
 */
export async function readEventsByType(type: string): Promise<ShoppingEvent[]> {
  const store = await getStore();
  const result = await store.query<ShoppingEvent>()
    .matchType(type)
    .read();
  return result.events.map(toShoppingEvent);
}

/**
 * Read all events (global stream)
 */
export async function readAllEvents(): Promise<ShoppingEvent[]> {
  const store = await getStore();
  const result = await store.all<ShoppingEvent>().read();
  return result.events.map(toShoppingEvent);
}

/**
 * Append events for a cart with optimistic concurrency.
 */
export async function appendCartEvents(cartId: string, events: ShoppingEvent[]): Promise<void> {
  const store = await getStore();
  const toStore = events.map((e) => ({
    type: e.type,
    data: e.data as Record<string, unknown>,
  }));

  const { appendCondition } = await readCartEventsWithCondition(cartId);
  await store.append(toStore, appendCondition);
}

/**
 * Blind append (no concurrency check) - for translations/external events
 */
export async function appendEvents(events: ShoppingEvent[]): Promise<void> {
  const store = await getStore();
  const toStore = events.map((e) => ({
    type: e.type,
    data: e.data as Record<string, unknown>,
  }));

  await store.append(toStore, null);
}

/**
 * Convert a StoredEvent to our typed ShoppingEvent
 */
function toShoppingEvent(stored: { type: string; data: Record<string, unknown> }): ShoppingEvent {
  return {
    type: stored.type,
    data: stored.data,
  } as ShoppingEvent;
}
