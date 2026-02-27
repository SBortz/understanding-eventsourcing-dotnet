import type { Express } from 'express';
import type { ShoppingEvent, CartCreated, ItemAdded } from '../domain/events.js';
import { buildState, type CartState } from '../domain/cart.js';
import { readCartEvents, appendCartEvents } from '../store/helpers.js';

export interface AddItemCommand {
  cartId: string;
  itemId: string;
  productId: string;
  description?: string;
  image?: string;
  price: number;
}

export function addItemDecider(state: CartState, command: AddItemCommand): ShoppingEvent[] {
  const events: ShoppingEvent[] = [];

  if (state.cartId === null) {
    events.push({ type: 'CartCreated', data: { cartId: command.cartId } });
  }

  if (state.cartItems.size >= 3) {
    throw new Error(
      `Too many items in cart ${command.cartId}: cannot add item ${command.itemId}`,
    );
  }

  events.push({
    type: 'ItemAdded',
    data: {
      cartId: command.cartId,
      itemId: command.itemId,
      productId: command.productId,
      description: command.description,
      image: command.image,
      price: command.price,
    },
  });

  return events;
}

export function addItemRoutes(app: Express): void {
  app.post('/additem', async (req, res) => {
    try {
      const command: AddItemCommand = req.body;

      const existingEvents = await readCartEvents(command.cartId);
      const state = buildState(existingEvents);
      const newEvents = addItemDecider(state, command);

      await appendCartEvents(command.cartId, newEvents);

      res.status(200).json({ success: true, events: newEvents });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  });
}
