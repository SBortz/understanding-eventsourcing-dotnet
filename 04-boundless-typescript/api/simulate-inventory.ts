import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeChangeInventory } from '../../src/slices/change-inventory.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await executeChangeInventory(req.body);
    res.status(200).end();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
