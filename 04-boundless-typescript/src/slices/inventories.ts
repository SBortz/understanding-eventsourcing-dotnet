import type { ShoppingEvent, InventoryChanged } from '../domain/events.js';
import { readEventsByType } from '../store/helpers.js';

export function projectInventories(events: ShoppingEvent[]): Record<string, number> {
  const inventories: Record<string, number> = {};

  for (const event of events) {
    if (event.type === 'InventoryChanged') {
      const { productId, inventory } = (event as InventoryChanged).data;
      inventories[productId] = inventory;
    }
  }

  return inventories;
}

export async function getInventories(): Promise<Record<string, number>> {
  const events = await readEventsByType('InventoryChanged');
  return projectInventories(events);
}
