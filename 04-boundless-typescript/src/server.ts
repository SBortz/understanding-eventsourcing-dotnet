// Shopping Cart API Server - BoundlessDB + Decider Pattern

import express from 'express';
import cors from 'cors';
import { closeStore } from './store/setup.js';

// Import usecase functions
import { executeAddItem } from './slices/add-item.js';
import { executeRemoveItem } from './slices/remove-item.js';
import { executeClearCart } from './slices/clear-cart.js';
import { executeSubmitCart } from './slices/submit-cart.js';
import { getCartItems } from './slices/cart-items.js';
import { getInventories } from './slices/inventories.js';
import { getCartsWithProducts } from './slices/carts-with-products.js';
import { executeChangeInventory } from './slices/change-inventory.js';
import { executeChangePrice, getPrices } from './slices/change-price.js';
import { getOrders } from './slices/orders.js';
import { getDebugEvents, getDebugState } from './slices/explorer.js';

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- Commands ---

app.post('/api/additem', async (req, res) => {
  try {
    const result = await executeAddItem(req.body);
    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

app.post('/api/removeitem', async (req, res) => {
  try {
    const result = await executeRemoveItem(req.body);
    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

app.post('/api/clearcart', async (req, res) => {
  try {
    const result = await executeClearCart(req.body);
    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

app.post('/api/submit-cart', async (req, res) => {
  try {
    const result = await executeSubmitCart(req.body);
    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

// --- Simulation (admin) ---

app.post('/api/simulate/inventory', async (req, res) => {
  try {
    await executeChangeInventory(req.body);
    res.sendStatus(200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.post('/api/simulate/price', async (req, res) => {
  try {
    const result = await executeChangePrice(req.body);
    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// --- State Views ---

app.get('/api/inventories', async (_req, res) => {
  try {
    res.status(200).json(await getInventories());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.get('/api/prices', async (_req, res) => {
  try {
    res.status(200).json(await getPrices());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.get('/api/orders', async (_req, res) => {
  try {
    res.status(200).json(await getOrders());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.get('/api/:cartId/cartitems', async (req, res) => {
  try {
    const view = await getCartItems(req.params.cartId);
    res.status(200).json(view);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// --- Debug ---

app.get('/api/debug/carts-with-products', async (_req, res) => {
  try {
    res.status(200).json(await getCartsWithProducts());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.get('/api/debug/events', async (_req, res) => {
  try {
    res.status(200).json(await getDebugEvents());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.get('/api/debug/state', async (_req, res) => {
  try {
    res.status(200).json(await getDebugState());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// --- Frontend static + SPA fallback ---

app.use(express.static(join(__dirname, '..', 'frontend', 'dist')));

// SPA fallback: serve index.html for known frontend routes
for (const route of ['/cart', '/admin', '/orders', '/info', '/events', '/state']) {
  app.get(route, (_req, res) => {
    res.sendFile(join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

// /cart/:cartId — SPA route for viewing specific carts
app.get('/cart/:id', (_req, res) => {
  res.sendFile(join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

// Graceful shutdown
process.on('SIGINT', () => {
  closeStore();
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Shopping Cart API running on http://localhost:${PORT}`);
});

export { app };
