import { useEffect, useState, useCallback } from 'react';

const BASE = import.meta.env.DEV ? '/api' : '';

interface StoredEvent {
  position: number;
  type: string;
  data: Record<string, unknown>;
  keys: Array<{ name: string; value: string }>;
  timestamp: string;
}

interface StateView {
  inventories: Record<string, number>;
  orders: Array<{ cartId: string; totalPrice: number }>;
  prices: Record<string, number>;
  cartsWithProducts: Array<{ cartId: string; productId: string }>;
  totalEvents: number;
}

const EVENT_COLORS: Record<string, string> = {
  CartCreated: '#7aa2f7',
  ItemAdded: '#9ece6a',
  ItemRemoved: '#f7768e',
  ItemArchived: '#bb9af7',
  CartSubmitted: '#ff9e64',
  CartCleared: '#e0af68',
  CartPublished: '#73daca',
  CartPublicationFailed: '#f7768e',
  InventoryChanged: '#2ac3de',
  PriceChanged: '#e0af68',
};

export default function ExplorerPage() {
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [state, setState] = useState<StateView | null>(null);
  const [tab, setTab] = useState<'events' | 'state'>('events');
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [filterKey, setFilterKey] = useState<string>('');

  const refresh = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const [evRes, stRes] = await Promise.all([
        fetch(`${BASE}/debug/events`),
        fetch(`${BASE}/debug/state`),
      ]);
      setEvents(await evRes.json());
      setState(await stRes.json());
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

  // Get unique event types and key names for filters
  const eventTypes = [...new Set(events.map(e => e.type))].sort();
  const keyNames = [...new Set(events.flatMap(e => e.keys.map(k => `${k.name}:${k.value}`)))].sort();

  const filtered = events
    .filter(e => {
      if (filterType && e.type !== filterType) return false;
      if (filterKey && !e.keys.some(k => `${k.name}:${k.value}` === filterKey)) return false;
      return true;
    })
    .slice()
    .reverse();

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <h1>🔍 Event Explorer</h1>
      <p className="subtitle">
        Live view of all events, keys, and state views
        {state && <span> — <strong>{state.totalEvents}</strong> events total</span>}
      </p>

      <div className="explorer-tabs">
        <button
          className={`explorer-tab ${tab === 'events' ? 'active' : ''}`}
          onClick={() => setTab('events')}
        >
          📜 Events
        </button>
        <button
          className={`explorer-tab ${tab === 'state' ? 'active' : ''}`}
          onClick={() => setTab('state')}
        >
          📊 State Views
        </button>
        <button className="explorer-refresh" onClick={() => refresh()}>
          🔄 Refresh
        </button>
      </div>

      {tab === 'events' && (
        <>
          <div className="explorer-filters">
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Event Types</option>
              {eventTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select value={filterKey} onChange={e => setFilterKey(e.target.value)}>
              <option value="">All Keys</option>
              {keyNames.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <span className="explorer-count">{filtered.length} events</span>
          </div>

          <div className="event-list">
            {filtered.map(event => (
              <div className="event-row" key={event.position}>
                <div className="event-pos">#{event.position}</div>
                <div
                  className="event-type-badge"
                  style={{ background: EVENT_COLORS[event.type] || '#666' }}
                >
                  {event.type}
                </div>
                <div className="event-keys">
                  {event.keys.map((k, i) => (
                    <span
                      key={i}
                      className="key-badge"
                      onClick={() => setFilterKey(`${k.name}:${k.value}`)}
                      title={`Filter by ${k.name}:${k.value}`}
                    >
                      {k.name}={k.value.length > 12 ? k.value.substring(0, 12) + '…' : k.value}
                    </span>
                  ))}
                </div>
                <div className="event-data">
                  {formatData(event.data)}
                </div>
              </div>
            ))}
            {filtered.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                No events yet. Try adding items to your cart!
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'state' && state && (
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

          {/* CartsWithProductsSV */}
          <div className="state-card wide">
            <h3>🛒 CartsWithProductsSV ({state.cartsWithProducts.length})</h3>
            {state.cartsWithProducts.length === 0 ? (
              <p className="state-empty">No items in carts</p>
            ) : (
              <div className="state-table">
                {state.cartsWithProducts.map((entry, i) => (
                  <div className="state-row" key={i}>
                    <span className="state-key">cart: {entry.cartId.substring(0, 8)}…</span>
                    <span className="state-value">{entry.productId}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatData(data: Record<string, unknown>): string {
  const entries = Object.entries(data)
    .filter(([k]) => k !== 'cartId')
    .map(([k, v]) => {
      if (typeof v === 'number') return `${k}: ${v}`;
      if (typeof v === 'string') return `${k}: ${v.length > 16 ? v.substring(0, 16) + '…' : v}`;
      if (Array.isArray(v)) return `${k}: [${v.length}]`;
      return `${k}: ${JSON.stringify(v)}`;
    });
  return entries.join(' · ');
}
