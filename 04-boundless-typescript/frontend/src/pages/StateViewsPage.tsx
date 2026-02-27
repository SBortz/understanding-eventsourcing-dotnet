import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

const BASE = import.meta.env.DEV ? '/api' : '';

interface CartView {
  cartId: string;
  totalPrice: number;
  isSubmitted: boolean;
  items: Array<{
    itemId: string;
    productId: string;
    description?: string;
    image?: string;
    price: number;
  }>;
}

interface StateView {
  inventories: Record<string, number>;
  orders: Array<{ cartId: string; totalPrice: number }>;
  prices: Record<string, number>;
  carts: Record<string, CartView>;
  totalEvents: number;
}

export default function StateViewsPage() {
  const [state, setState] = useState<StateView | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const res = await fetch(`${BASE}/debug/state`);
      setState(await res.json());
    } catch {
      // ignore
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(true);
    const interval = setInterval(() => refresh(), 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (loading || !state) {
    return <div className="page"><p>Loading...</p></div>;
  }

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <h1>📊 State Views</h1>
      <p className="subtitle">
        Live projections from <strong>{state.totalEvents}</strong> events
      </p>

      <div className="explorer-tabs">
        <div style={{ flex: 1 }} />
        <button className="explorer-refresh" onClick={() => refresh()}>
          🔄 Refresh
        </button>
      </div>

      <div className="state-grid">
        {/* Inventories */}
        <div className="state-card">
          <h3>📦 InventoriesSV</h3>
          {Object.keys(state.inventories).length === 0 ? (
            <p className="state-empty">No inventory data</p>
          ) : (
            <div className="state-table">
              {Object.entries(state.inventories).map(([productId, count]) => (
                <div className="state-row" key={productId}>
                  <span className="state-key">{productId}</span>
                  <span className={`state-value ${count <= 0 ? 'danger' : count <= 5 ? 'warn' : ''}`}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prices */}
        <div className="state-card">
          <h3>💰 ChangedPricesSV</h3>
          {Object.keys(state.prices).length === 0 ? (
            <p className="state-empty">No price changes</p>
          ) : (
            <div className="state-table">
              {Object.entries(state.prices).map(([productId, price]) => (
                <div className="state-row" key={productId}>
                  <span className="state-key">{productId}</span>
                  <span className="state-value">${price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="state-card">
          <h3>📋 OrdersSV ({state.orders.length})</h3>
          {state.orders.length === 0 ? (
            <p className="state-empty">No orders yet</p>
          ) : (
            <div className="state-table">
              {state.orders.map((order, i) => (
                <div className="state-row" key={i}>
                  <span className="state-key">{order.cartId.substring(0, 8)}…</span>
                  <span className="state-value">${order.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CartItemsStateView per cart */}
        <div className="state-card wide">
          <h3>🛒 CartItemsStateView ({Object.keys(state.carts).length} carts)</h3>
          {Object.keys(state.carts).length === 0 ? (
            <p className="state-empty">No carts yet</p>
          ) : (
            <div className="cart-views">
              {Object.entries(state.carts).map(([cartId, cart]) => (
                <div className={`cart-view-card ${cart.isSubmitted ? 'submitted' : ''}`} key={cartId}>
                  <div className="cart-view-header">
                    <Link to={`/cart/${cartId}`} className="cart-view-id cart-view-link">{cartId.substring(0, 12)}…</Link>
                    {cart.isSubmitted && <span className="cart-status submitted">✅ Submitted</span>}
                    {!cart.isSubmitted && cart.items.length > 0 && <span className="cart-status active">Active</span>}
                    {!cart.isSubmitted && cart.items.length === 0 && <span className="cart-status empty">Empty</span>}
                    <span className="cart-view-total">${cart.totalPrice.toFixed(2)}</span>
                  </div>
                  {cart.items.length > 0 && (
                    <div className="cart-view-items">
                      {cart.items.map((item) => (
                        <div className="cart-view-item" key={item.itemId}>
                          <span className="cart-view-emoji">{item.image || '📦'}</span>
                          <span className="cart-view-product">{item.description || item.productId}</span>
                          <span className="cart-view-price">${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
