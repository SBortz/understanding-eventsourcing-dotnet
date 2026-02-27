import type { Express } from 'express';
import type { ShoppingEvent, ItemQuantityChanged } from '../domain/events.js';
import { buildState, type CartState } from '../domain/cart.js';
import { readCartEvents, appendCartEvents } from '../store/helpers.js';

export interface ChangeItemQuantityCommand {
  cartId: string;
  itemId: string;
  newQuantity: number;
}

export function changeItemQuantityDecider(
  state: CartState,
  command: ChangeItemQuantityCommand,
): ShoppingEvent[] {
  if (!state.cartItems.has(command.itemId)) {
    throw new Error(`Item ${command.itemId} not found in cart`);
  }

  if (command.newQuantity < 1) {
    throw new Error('Quantity must be at least 1');
  }

  const event: ItemQuantityChanged = {
    type: 'ItemQuantityChanged',
    data: {
      cartId: command.cartId,
      itemId: command.itemId,
      newQuantity: command.newQuantity,
    },
  };

  return [event];
}

export function changeItemQuantityRoutes(app: Express): void {
  app.post('/change-quantity', async (req, res) => {
    try {
      const command: ChangeItemQuantityCommand = req.body;

      const existingEvents = await readCartEvents(command.cartId);
      const state = buildState(existingEvents);
      const newEvents = changeItemQuantityDecider(state, command);

      await appendCartEvents(command.cartId, newEvents);

      res.status(200).json({ success: true, events: newEvents });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  });
}
