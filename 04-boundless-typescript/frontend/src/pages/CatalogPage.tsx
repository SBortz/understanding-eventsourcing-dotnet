import { useEffect, useState, useCallback } from 'react';
import { PRODUCTS } from '../products';
import { fetchInventories, fetchCartItems, addItem } from '../api';
import { getCartId, generateItemId } from '../cartId';
import type { Inventories } from '../types';

function stockLabel(count: number | undefined): {
  text: string;
  className: string;
} {
  if (count === undefined)
    return { text: 'Unknown', className: 'stock-badge stock-out' };
  if (count <= 0)
    return { text: 'Out of Stock', className: 'stock-badge stock-out' };
  if (count <= 5)
    return { text: 'Almost Gone', className: 'stock-badge stock-low' };
  if (count <= 10)
    return { text: 'Low Stock', className: 'stock-badge stock-medium' };
  return { text: 'In Stock', className: 'stock-badge stock-high' };
}

export default function CatalogPage() {
  const [inventories, setInventories] = useState<Inventories>({});
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const cartId = getCartId();

  const refresh = useCallback(async () => {
    try {
      const [inv, cart] = await Promise.all([
        fetchInventories(),
        fetchCartItems(cartId),
      ]);
      setInventories(inv);
      setCartCount(cart.items?.length ?? 0);
    } catch {
      // Cart may not exist yet — that's fine
      try {
        const inv = await fetchInventories();
        setInventories(inv);
      } catch {
        // backend may be down
      }
    }
  }, [cartId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAddToCart = async (productId: string) => {
    const product = PRODUCTS.find((p) => p.productId === productId);
    if (!product) return;

    setLoading(productId);
    try {
      await addItem({
        cartId,
        itemId: generateItemId(),
        productId: product.productId,
        description: product.description,
        image: product.emoji,
        price: product.price,
      });
      showToast(`${product.name} added to cart!`, 'success');
      await refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to add item';
      showToast(msg, 'error');
    } finally {
      setLoading(null);
    }
  };

  const cartFull = cartCount >= 3;

  return (
    <div className="page">
      <h1>Product Catalog</h1>

      <p className="subtitle">
        Browse our products and add them to your cart
      </p>

      {cartFull && (
        <div className="cart-full-warning">
          <strong>Cart full!</strong> Your cart already has 3 items (the
          maximum). Remove an item before adding more.
        </div>
      )}

      <div className="product-grid">
        {PRODUCTS.map((product) => {
          const stock = inventories[product.productId];
          const label = stockLabel(stock);
          const outOfStock = stock !== undefined && stock <= 0;

          return (
            <div className="product-card" key={product.productId}>
              <div className="product-image">{product.emoji}</div>
              <div className="product-name">{product.name}</div>
              <div className="product-price">
                ${product.price.toFixed(2)}
              </div>
              <div className="stock-info">
                <span className={label.className}>{label.text}</span>
                {stock !== undefined && (
                  <span className="stock-count">
                    {stock} available
                  </span>
                )}
              </div>
              <button
                className="add-button"
                disabled={
                  cartFull ||
                  outOfStock ||
                  loading === product.productId
                }
                onClick={() => handleAddToCart(product.productId)}
              >
                {loading === product.productId
                  ? 'Adding...'
                  : 'Add to Cart'}
              </button>
            </div>
          );
        })}
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
