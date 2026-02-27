const CART_ID_KEY = 'shopping-cart-id';

export function getCartId(): string {
  let cartId = localStorage.getItem(CART_ID_KEY);
  if (!cartId) {
    cartId = crypto.randomUUID();
    localStorage.setItem(CART_ID_KEY, cartId);
  }
  return cartId;
}

export function resetCartId(): string {
  const cartId = crypto.randomUUID();
  localStorage.setItem(CART_ID_KEY, cartId);
  return cartId;
}
