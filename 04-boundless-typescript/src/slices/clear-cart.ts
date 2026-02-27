import type { Express } from 'express';
import type { ShoppingEvent, CartCleared } from '../domain/events.js';
import { buildState, type CartState } from '../domain/cart.js';
import { readCartEvents, appendCartEvents } from '../store/helpers.js';

export interface ClearCartCommand {
  cartId: string;
}

export function clearCartDecider(state: CartState, command: ClearCartCommand): ShoppingEvent[] {
  if (state.cartId === null) {
    throw new Error(`Cart ${command.cartId} does not exist`);
  }

  return [
    {
      type: 'CartCleared',
      data: { cartId: state.cartId },
    },
  ];
}

export function clearCartRoutes(app: Express): void {
  app.post('/clearcart', async (req, res) => {
    try {
      const command: ClearCartCommand = req.body;

      const existingEvents = await readCartEvents(command.cartId);
      const state = buildState(existingEvents);
      const newEvents = clearCartDecider(state, command);

      await appendCartEvents(command.cartId, newEvents);

      res.status(200).json({ success: true, events: newEvents });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  });
}
