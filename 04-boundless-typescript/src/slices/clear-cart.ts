import type { ShoppingEvent } from '../domain/events.js';
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

export async function executeClearCart(command: ClearCartCommand): Promise<{ success: boolean; events: ShoppingEvent[] }> {
  const existingEvents = await readCartEvents(command.cartId);
  const state = buildState(existingEvents);
  const newEvents = clearCartDecider(state, command);
  await appendCartEvents(command.cartId, newEvents);
  return { success: true, events: newEvents };
}
