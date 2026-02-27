// Shopping Cart API Server - BoundlessDB + Decider Pattern

import express from 'express';
import cors from 'cors';
import { closeStore } from './store/setup.js';

// Import slice routes
import { addItemRoutes } from './slices/add-item.js';
import { removeItemRoutes } from './slices/remove-item.js';
import { clearCartRoutes } from './slices/clear-cart.js';
import { submitCartRoutes } from './slices/submit-cart.js';
import { cartItemsRoutes } from './slices/cart-items.js';
import { inventoriesRoutes } from './slices/inventories.js';
import { cartsWithProductsRoutes } from './slices/carts-with-products.js';
import { changeInventoryRoutes } from './slices/change-inventory.js';
import { changePriceRoutes } from './slices/change-price.js';
import { ordersRoutes } from './slices/orders.js';
import { explorerRoutes } from './slices/explorer.js';

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Register all slice routes
addItemRoutes(app);
removeItemRoutes(app);
clearCartRoutes(app);
submitCartRoutes(app);
cartItemsRoutes(app);
inventoriesRoutes(app);
cartsWithProductsRoutes(app);
changeInventoryRoutes(app);
changePriceRoutes(app);
ordersRoutes(app);
explorerRoutes(app);

// Serve frontend static files
app.use(express.static(join(__dirname, '..', 'frontend', 'dist')));

// SPA fallback: serve index.html for known frontend routes
for (const route of ['/cart', '/admin', '/orders', '/info', '/explorer']) {
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
