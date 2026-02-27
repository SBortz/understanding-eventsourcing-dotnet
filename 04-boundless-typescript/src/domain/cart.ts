// Cart state and evolution (Decider pattern)

import type { ShoppingEvent } from './events.js';

export interface CartState {
  cartId: string | null;
  cartItems: Map<string, string>; // itemId -> productId
  productPrices: Map<string, number>; // productId -> price
  isSubmitted: boolean;
  isPublished: boolean;
  publicationFailed: boolean;
}

export const initialCart: CartState = {
  cartId: null,
  cartItems: new Map(),
  productPrices: new Map(),
  isSubmitted: false,
  isPublished: false,
  publicationFailed: false,
};

export function evolve(state: CartState, event: ShoppingEvent): CartState {
  switch (event.type) {
    case 'CartCreated':
      return { ...state, cartId: event.data.cartId };

    case 'ItemAdded': {
      const cartItems = new Map(state.cartItems);
      const productPrices = new Map(state.productPrices);
      cartItems.set(event.data.itemId, event.data.productId);
      productPrices.set(event.data.productId, event.data.price);
      return { ...state, cartItems, productPrices };
    }

    case 'ItemRemoved': {
      const cartItems = new Map(state.cartItems);
      const productPrices = new Map(state.productPrices);
      const productId = cartItems.get(event.data.itemId);
      if (productId) productPrices.delete(productId);
      cartItems.delete(event.data.itemId);
      return { ...state, cartItems, productPrices };
    }

    case 'ItemArchived': {
      const cartItems = new Map(state.cartItems);
      const productPrices = new Map(state.productPrices);
      const productId = cartItems.get(event.data.itemId);
      cartItems.delete(event.data.itemId);
      if (productId) productPrices.delete(productId);
      return { ...state, cartItems, productPrices };
    }

    case 'CartSubmitted':
      return { ...state, isSubmitted: true };

    case 'CartCleared':
      return { ...state, cartItems: new Map() };

    case 'CartPublished':
      return { ...state, isPublished: true };

    case 'CartPublicationFailed':
      return { ...state, publicationFailed: true };

    default:
      return state;
  }
}

/**
 * Build cart state from a list of events
 */
export function buildState(events: ShoppingEvent[]): CartState {
  return events.reduce(evolve, initialCart);
}
