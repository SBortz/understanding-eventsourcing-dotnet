import type { ShoppingEvent, InventoryChanged } from '../domain/events.js';
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
  // Count how many of each product are in the cart
  const productCounts = new Map<string, number>();
  for (const [, productId] of state.cartItems) {
    productCounts.set(productId, (productCounts.get(productId) ?? 0) + 1);
  }

  for (const [productId, needed] of productCounts) {
    const available = inventories.get(productId) ?? 0;
    if (available < needed) {
      throw new Error(
        `Product ${productId} is out of stock (need ${needed}, have ${available})`,
      );
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

export async function executeSubmitCart(command: SubmitCartCommand): Promise<{ success: boolean; events: ShoppingEvent[] }> {
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

  return { success: true, events: newEvents };
}
