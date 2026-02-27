import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDebugEvents } from '../../src/slices/explorer.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    res.status(200).json(await getDebugEvents());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
