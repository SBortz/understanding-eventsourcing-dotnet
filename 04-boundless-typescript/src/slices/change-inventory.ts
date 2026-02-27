import type { Express } from 'express';
import { getStore } from '../store/setup.js';

export function changeInventoryRoutes(app: Express): void {
  app.post('/debug/simulate-inventory-changed', async (req, res) => {
    const { productId, inventory } = req.body;

    await getStore().append([
      { type: 'InventoryChanged', data: { productId, inventory } },
    ], null);

    res.sendStatus(200);
  });
}
