import type { ShoppingEvent } from '../domain/events.js';
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

export async function executeAddItem(command: AddItemCommand): Promise<{ success: boolean; events: ShoppingEvent[] }> {
  const existingEvents = await readCartEvents(command.cartId);
  const state = buildState(existingEvents);
  const newEvents = addItemDecider(state, command);
  await appendCartEvents(command.cartId, newEvents);
  return { success: true, events: newEvents };
}
