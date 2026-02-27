const CART_ID_KEY = 'shopping-cart-id';

function generateId(): string {
  // crypto.randomUUID() requires secure context (HTTPS/localhost)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for HTTP contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getCartId(): string {
  let cartId = localStorage.getItem(CART_ID_KEY);
  if (!cartId) {
    cartId = generateId();
    localStorage.setItem(CART_ID_KEY, cartId);
  }
  return cartId;
}

export function resetCartId(): string {
  const cartId = generateId();
  localStorage.setItem(CART_ID_KEY, cartId);
  return cartId;
}
