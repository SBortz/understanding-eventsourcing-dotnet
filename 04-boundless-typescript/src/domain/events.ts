// All domain events for the Shopping Cart

// Cart lifecycle
export type CartCreated = {
  type: 'CartCreated';
  data: { cartId: string };
};

export type ItemAdded = {
  type: 'ItemAdded';
  data: {
    cartId: string;
    itemId: string;
    productId: string;
    description?: string;
    image?: string;
    price: number;
  };
};

export type ItemRemoved = {
  type: 'ItemRemoved';
  data: { itemId: string; cartId: string };
};

export type ItemArchived = {
  type: 'ItemArchived';
  data: { cartId: string; itemId: string };
};

export type ItemQuantityChanged = {
  type: 'ItemQuantityChanged';
  data: { cartId: string; itemId: string; newQuantity: number };
};

export type CartSubmitted = {
  type: 'CartSubmitted';
  data: {
    cartId: string;
    orderedProducts: Array<{ productId: string; totalPrice: number }>;
  };
};

export type CartCleared = {
  type: 'CartCleared';
  data: { cartId: string };
};

export type CartPublished = {
  type: 'CartPublished';
  data: { cartId: string };
};

export type CartPublicationFailed = {
  type: 'CartPublicationFailed';
  data: { cartId: string; reason: string };
};

// External / Pricing
export type InventoryChanged = {
  type: 'InventoryChanged';
  data: { productId: string; inventory: number };
};

export type PriceChanged = {
  type: 'PriceChanged';
  data: { productId: string; oldPrice: number; newPrice: number };
};

// Union type of all events
export type ShoppingEvent =
  | CartCreated
  | ItemAdded
  | ItemRemoved
  | ItemArchived
  | ItemQuantityChanged
  | CartSubmitted
  | CartCleared
  | CartPublished
  | CartPublicationFailed
  | InventoryChanged
  | PriceChanged;

// All event type strings
export const ALL_EVENT_TYPES = [
  'CartCreated',
  'ItemAdded',
  'ItemRemoved',
  'ItemArchived',
  'ItemQuantityChanged',
  'CartSubmitted',
  'CartCleared',
  'CartPublished',
  'CartPublicationFailed',
  'InventoryChanged',
  'PriceChanged',
] as const;
