// RemoveItem decider slice

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

// Usecase
export async function executeRemoveItem(command: RemoveItemCommand): Promise<{ success: boolean; events: ShoppingEvent[] }> {
  const events = await readCartEvents(command.cartId);
  const state = buildState(events);
  const newEvents = removeItemDecider(state, command);
  await appendCartEvents(command.cartId, newEvents);
  return { success: true, events: newEvents };
}
