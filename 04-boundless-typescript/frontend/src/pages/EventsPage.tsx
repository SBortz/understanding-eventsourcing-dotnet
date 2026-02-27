import { useEffect, useState, useCallback } from 'react';

const BASE = import.meta.env.DEV ? '/api' : '';

interface StoredEvent {
  position: number;
  type: string;
  data: Record<string, unknown>;
  keys: Array<{ name: string; value: string }>;
  timestamp: string;
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

export default function EventsPage() {
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [filterKey, setFilterKey] = useState<string>('');

  const refresh = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const res = await fetch(`${BASE}/debug/events`);
      const data = await res.json();
      setEvents(data);
      setTotalEvents(data.length);
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
      <h1>📜 Events</h1>
      <p className="subtitle">
        Live event stream — <strong>{totalEvents}</strong> events total
      </p>

      <div className="explorer-tabs">
        <div className="explorer-filters" style={{ flex: 1, margin: 0 }}>
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
        <button className="explorer-refresh" onClick={() => refresh()}>
          🔄 Refresh
        </button>
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
