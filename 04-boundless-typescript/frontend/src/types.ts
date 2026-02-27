export interface Product {
  productId: string;
  name: string;
  description: string;
  emoji: string;
  price: number;
}

export interface CartItem {
  cartId: string;
  itemId: string;
  productId: string;
  description?: string;
  image?: string;
  price: number;
}

export interface CartItemsView {
  cartId: string;
  totalPrice: number;
  items: CartItem[];
}

export type Inventories = Record<string, number>;
