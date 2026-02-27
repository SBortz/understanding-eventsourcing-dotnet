// Shopping Cart API Server - BoundlessDB + Decider Pattern

import express from 'express';
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

const app = express();
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
