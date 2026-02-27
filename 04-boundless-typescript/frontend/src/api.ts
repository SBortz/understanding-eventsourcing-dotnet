const BASE = import.meta.env.DEV ? '/api' : '';

export async function fetchInventories(): Promise<Record<string, number>> {
  const res = await fetch(`${BASE}/inventories`);
  if (!res.ok) throw new Error('Failed to fetch inventories');
  return res.json();
}

export async function fetchCartItems(cartId: string) {
  const res = await fetch(`${BASE}/${cartId}/cartitems`);
  if (!res.ok) throw new Error('Failed to fetch cart items');
  return res.json();
}

export async function addItem(body: {
  cartId: string;
  itemId: string;
  productId: string;
  description?: string;
  image?: string;
  price: number;
}) {
  const res = await fetch(`${BASE}/additem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add item');
  return data;
}

export async function removeItem(body: { cartId: string; itemId: string }) {
  const res = await fetch(`${BASE}/removeitem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to remove item');
  return data;
}

export async function clearCart(cartId: string) {
  const res = await fetch(`${BASE}/clearcart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to clear cart');
  return data;
}

export async function submitCart(body: {
  cartId: string;
  orderedProducts: Array<{ productId: string; totalPrice: number }>;
}) {
  const res = await fetch(`${BASE}/submit-cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to submit cart');
  return data;
}

export async function simulateInventoryChange(body: {
  productId: string;
  inventory: number;
}) {
  const res = await fetch(`${BASE}/debug/simulate-inventory-changed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to simulate inventory change');
}

export async function simulatePriceChange(body: {
  productId: string;
  oldPrice: number;
  newPrice: number;
}) {
  const res = await fetch(`${BASE}/debug/simulate-price-changed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to simulate price change');
}
