import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeRemoveItem } from '../src/slices/remove-item.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const result = await executeRemoveItem(req.body);
    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
}
