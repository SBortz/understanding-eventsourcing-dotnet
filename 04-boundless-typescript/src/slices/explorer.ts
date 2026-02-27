import type { Express } from 'express';
import { ALL_EVENT_TYPES } from '../domain/events.js';
import { getStore } from '../store/setup.js';
import { consistency } from '../store/setup.js';

export function explorerRoutes(app: Express): void {
  // All events with position, timestamp, and extracted keys
  app.get('/debug/events', async (_req, res) => {
    try {
      const store = getStore();
      const result = await store.read({
        conditions: ALL_EVENT_TYPES.map(type => ({ type })),
      });

      const events = result.events.map(e => {
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
      });

      res.status(200).json(events);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  });

  // Current state views (all projections computed live)
  app.get('/debug/state', async (_req, res) => {
    try {
      const store = getStore();
      const result = await store.read({
        conditions: ALL_EVENT_TYPES.map(type => ({ type })),
      });

      // Import projections dynamically to avoid circular deps
      const { projectCartItems } = await import('./cart-items.js');
      const { projectOrders } = await import('./orders.js');
      const { projectCurrentPrices } = await import('./change-price.js');

      // Build inventories
      const inventories: Record<string, number> = {};
      // Build carts map (cartId → events)
      const cartEvents = new Map<string, typeof result.events>();

      for (const e of result.events) {
        const data = e.data as Record<string, unknown>;

        if (e.type === 'InventoryChanged') {
          inventories[data.productId as string] = data.inventory as number;
        }

        const cartId = data.cartId as string | undefined;
        if (cartId) {
          if (!cartEvents.has(cartId)) cartEvents.set(cartId, []);
          cartEvents.get(cartId)!.push(e);
        }
      }

      // Build cart projections
      const carts: Record<string, unknown> = {};
      for (const [cartId, events] of cartEvents) {
        const typed = events.map(e => ({ type: e.type, data: e.data }) as any);
        carts[cartId] = projectCartItems(typed);
      }

      // Build orders
      const allTyped = result.events.map(e => ({ type: e.type, data: e.data }) as any);
      const orders = projectOrders(allTyped);
      const prices = projectCurrentPrices(allTyped);

      res.status(200).json({
        inventories,
        carts,
        orders,
        prices,
        totalEvents: result.events.length,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  });
}

function getNestedValue(obj: any, path: string): unknown {
  return path.split('.').reduce((o, key) => o?.[key], obj);
}
