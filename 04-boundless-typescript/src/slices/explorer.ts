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
      const { projectOrders } = await import('./orders.js');
      const { projectCurrentPrices } = await import('./change-price.js');
      const { projectCartsWithProducts } = await import('./carts-with-products.js');
      const { projectCartItems } = await import('./cart-items.js');

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
          cartLastPosition.set(data.cartId as string, result.events[i].position as number);
        }
      }

      const carts: Record<string, unknown> = {};
      for (const [cartId, lastPos] of cartLastPosition) {
        const cartEvts = allTyped.filter((e: any) => e.data.cartId === cartId);
        const view = projectCartItems(cartEvts);
        const isSubmitted = cartEvts.some((e: any) => e.type === 'CartSubmitted');
        carts[cartId] = { ...view, isSubmitted, lastPosition: lastPos };
      }

      res.status(200).json({
        inventories,
        orders,
        prices,
        cartsWithProducts,
        carts,
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
