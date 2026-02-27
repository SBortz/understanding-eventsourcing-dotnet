// RemoveItem decider slice

import type { Express } from 'express';
import type { ShoppingEvent, ItemRemoved } from '../domain/events.js';
import { buildState, type CartState } from '../domain/cart.js';
import { readCartEvents, appendCartEvents } from '../store/helpers.js';

// Command
export interface RemoveItemCommand {
  itemId: string;
  cartId: string;
}

// Error
export class ItemCanNotBeRemovedException extends Error {
  constructor(itemId: string) {
    super(`Item '${itemId}' cannot be removed because it does not exist in the cart.`);
    this.name = 'ItemCanNotBeRemovedException';
  }
}

// Decider
export function removeItemDecider(state: CartState, command: RemoveItemCommand): ShoppingEvent[] {
  if (!state.cartItems.has(command.itemId)) {
    throw new ItemCanNotBeRemovedException(command.itemId);
  }

  const event: ItemRemoved = {
    type: 'ItemRemoved',
    data: { itemId: command.itemId, cartId: command.cartId },
  };

  return [event];
}

// Routes
export function removeItemRoutes(app: Express): void {
  app.post('/removeitem', async (req, res) => {
    try {
      const command: RemoveItemCommand = req.body;

      const events = await readCartEvents(command.cartId);
      const state = buildState(events);
      const newEvents = removeItemDecider(state, command);
      await appendCartEvents(command.cartId, newEvents);

      res.status(200).json({ success: true, events: newEvents });
    } catch (error) {
      if (error instanceof ItemCanNotBeRemovedException) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
}
