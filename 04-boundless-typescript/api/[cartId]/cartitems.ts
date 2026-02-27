import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCartItems } from '../../src/slices/cart-items.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const cartId = req.query.cartId as string;
    res.status(200).json(await getCartItems(cartId));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
