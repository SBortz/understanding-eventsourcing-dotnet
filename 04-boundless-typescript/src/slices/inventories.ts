import type { Express } from 'express';
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

export function inventoriesRoutes(app: Express): void {
  app.get('/inventories', async (_req, res) => {
    const events = await readEventsByType('InventoryChanged');
    const inventories = projectInventories(events);
    res.status(200).json(inventories);
  });
}
