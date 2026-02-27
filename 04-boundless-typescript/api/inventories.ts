import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getInventories } from '../src/slices/inventories.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    res.status(200).json(await getInventories());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    res.status(500).json({ error: message, stack });
  }
}
