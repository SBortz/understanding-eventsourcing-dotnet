import type { ShoppingEvent } from '../domain/events.js';
import { readCartEvents } from '../store/helpers.js';

export interface CartItem {
  cartId: string;
  itemId: string;
  productId: string;
  description?: string;
  image?: string;
  price: number;
  quantity: number;
}

export interface CartItemsView {
  cartId: string;
  totalPrice: number;
  items: CartItem[];
}

export function projectCartItems(events: ShoppingEvent[]): CartItemsView {
  let items: CartItem[] = [];

  for (const event of events) {
    switch (event.type) {
      case 'ItemAdded':
        items.push({
          cartId: event.data.cartId,
          itemId: event.data.itemId,
          productId: event.data.productId,
          description: event.data.description,
          image: event.data.image,
          price: event.data.price,
          quantity: 1,
        });
        break;

      case 'ItemRemoved':
        items = items.filter((i) => i.itemId !== event.data.itemId);
        break;

      case 'ItemArchived':
        items = items.filter((i) => i.itemId !== event.data.itemId);
        break;

      case 'ItemQuantityChanged': {
        const item = items.find((i) => i.itemId === event.data.itemId);
        if (item) {
          item.quantity = event.data.newQuantity;
        }
        break;
      }

      case 'CartCleared':
        items = [];
        break;
    }
  }

  const cartId =
    events.find((e) => e.type === 'CartCreated')?.data.cartId ??
    (items.length > 0 ? items[0].cartId : '');

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { cartId, totalPrice, items };
}

export async function getCartItems(cartId: string): Promise<CartItemsView> {
  const events = await readCartEvents(cartId);
  const view = projectCartItems(events);
  return { ...view, cartId };
}
