import type { Express } from 'express';
import type { ShoppingEvent, CartSubmitted, InventoryChanged } from '../domain/events.js';
import { buildState, type CartState } from '../domain/cart.js';
import { readCartEvents, readEventsByType, appendCartEvents, appendEvents } from '../store/helpers.js';

export interface SubmitCartCommand {
  cartId: string;
  orderedProducts: Array<{ productId: string; totalPrice: number }>;
}

function buildInventories(inventoryEvents: InventoryChanged[]): Map<string, number> {
  const inventories = new Map<string, number>();
  for (const event of inventoryEvents) {
    inventories.set(event.data.productId, event.data.inventory);
  }
  return inventories;
}

function checkInventory(state: CartState, inventories: Map<string, number>): void {
  for (const [, productId] of state.cartItems) {
    const inventory = inventories.get(productId) ?? 0;
    if (inventory <= 0) {
      throw new Error(`Product ${productId} is out of stock`);
    }
  }
}

export function submitCartDecider(
  state: CartState,
  inventories: Map<string, number>,
  command: SubmitCartCommand,
): ShoppingEvent[] {
  checkInventory(state, inventories);

  if (state.cartItems.size === 0) {
    throw new Error('Cannot submit an empty cart');
  }

  if (state.isSubmitted) {
    throw new Error('Cart has already been submitted');
  }

  const events: ShoppingEvent[] = [];

  events.push({
    type: 'CartSubmitted',
    data: {
      cartId: command.cartId,
      orderedProducts: command.orderedProducts,
    },
  });

  // Reduce inventory for each ordered product
  for (const [, productId] of state.cartItems) {
    const current = inventories.get(productId) ?? 0;
    events.push({
      type: 'InventoryChanged',
      data: {
        productId,
        inventory: current - 1,
      },
    });
  }

  return events;
}

export function submitCartRoutes(app: Express): void {
  app.post('/submit-cart', async (req, res) => {
    try {
      const command: SubmitCartCommand = req.body;

      const cartEvents = await readCartEvents(command.cartId);
      const state = buildState(cartEvents);

      const inventoryEvents = await readEventsByType('InventoryChanged') as InventoryChanged[];
      const inventories = buildInventories(inventoryEvents);

      const newEvents = submitCartDecider(state, inventories, command);

      // Separate cart events from inventory events (different keys)
      const cartOnly = newEvents.filter(e => e.type !== 'InventoryChanged');
      const inventoryUpdates = newEvents.filter(e => e.type === 'InventoryChanged');

      await appendCartEvents(command.cartId, cartOnly);
      if (inventoryUpdates.length > 0) {
        await appendEvents(inventoryUpdates);
      }

      res.status(200).json({ success: true, events: newEvents });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  });
}
