import { useState, useEffect, useCallback } from 'react';
import { PRODUCTS } from '../products';
import { simulateInventoryChange, simulatePriceChange, fetchOrders } from '../api';
import type { Order } from '../types';

export default function AdminPage() {
  // Inventory form
  const [invProductId, setInvProductId] = useState(PRODUCTS[0].productId);
  const [invCount, setInvCount] = useState(50);

  // Price form
  const [priceProductId, setPriceProductId] = useState(PRODUCTS[0].productId);
  const [oldPrice, setOldPrice] = useState(PRODUCTS[0].price);
  const [newPrice, setNewPrice] = useState(PRODUCTS[0].price);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await simulateInventoryChange({
        productId: invProductId,
        inventory: invCount,
      });
      showToast(
        `Inventory for ${invProductId} set to ${invCount}`,
        'success',
      );
    } catch {
      showToast('Failed to update inventory', 'error');
    }
  };

  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await simulatePriceChange({
        productId: priceProductId,
        oldPrice,
        newPrice,
      });
      showToast(
        `Price for ${priceProductId} changed: $${oldPrice} → $${newPrice}`,
        'success',
      );
    } catch {
      showToast('Failed to change price', 'error');
    }
  };

  const handlePriceProductChange = (productId: string) => {
    setPriceProductId(productId);
    const product = PRODUCTS.find((p) => p.productId === productId);
    if (product) {
      setOldPrice(product.price);
      setNewPrice(product.price);
    }
  };

  const findProductName = (productId: string) => {
    const p = PRODUCTS.find((prod) => prod.productId === productId);
    return p ? `${p.emoji} ${p.name}` : productId;
  };

  return (
    <div className="page">
      <h1>🛠️ Admin Panel</h1>

      <p className="subtitle">
        Simulate external events and view orders
      </p>

      <div className="admin-grid">
        {/* Inventory Change */}
        <form className="admin-card" onSubmit={handleInventorySubmit}>
          <h2>📦 Simulate Inventory Change</h2>

          <label htmlFor="inv-product">Product</label>
          <select
            id="inv-product"
            value={invProductId}
            onChange={(e) => setInvProductId(e.target.value)}
          >
            {PRODUCTS.map((p) => (
              <option key={p.productId} value={p.productId}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>

          <label htmlFor="inv-count">Inventory Count</label>
          <input
            id="inv-count"
            type="number"
            min={0}
            value={invCount}
            onChange={(e) => setInvCount(Number(e.target.value))}
          />

          <button type="submit" className="admin-button">
            Update Inventory
          </button>
        </form>

        {/* Price Change */}
        <form className="admin-card" onSubmit={handlePriceSubmit}>
          <h2>💰 Simulate Price Change</h2>

          <label htmlFor="price-product">Product</label>
          <select
            id="price-product"
            value={priceProductId}
            onChange={(e) => handlePriceProductChange(e.target.value)}
          >
            {PRODUCTS.map((p) => (
              <option key={p.productId} value={p.productId}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>

          <label htmlFor="old-price">Old Price ($)</label>
          <input
            id="old-price"
            type="number"
            step="0.01"
            min={0}
            value={oldPrice}
            onChange={(e) => setOldPrice(Number(e.target.value))}
          />

          <label htmlFor="new-price">New Price ($)</label>
          <input
            id="new-price"
            type="number"
            step="0.01"
            min={0}
            value={newPrice}
            onChange={(e) => setNewPrice(Number(e.target.value))}
          />

          <button type="submit" className="admin-button">
            Change Price
          </button>
        </form>

        {/* Orders */}
        <div className="admin-card orders-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>📋 Orders</h2>
            <button
              className="admin-button"
              style={{ width: 'auto', marginTop: 0, padding: '6px 16px' }}
              onClick={loadOrders}
            >
              Refresh
            </button>
          </div>

          {ordersLoading ? (
            <p style={{ color: '#666', textAlign: 'center', padding: 20 }}>Loading...</p>
          ) : orders.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: 20 }}>No orders yet</p>
          ) : (
            <div className="order-list">
              {orders.map((order, i) => (
                <div className="order-card" key={i}>
                  <div>
                    <div className="order-id">
                      Cart {order.cartId.substring(0, 8)}...
                    </div>
                    <div className="order-products">
                      {order.orderedProducts.map((op, j) => (
                        <span key={j}>
                          {j > 0 && ', '}
                          {findProductName(op.productId)} (${op.totalPrice.toFixed(2)})
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="order-total">
                    ${order.totalPrice.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
