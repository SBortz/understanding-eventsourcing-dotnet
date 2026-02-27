export default function InfoPage() {
  return (
    <div className="page">
      <h1>ℹ️ About This Demo</h1>

      <p className="subtitle">
        A fully event-sourced shopping cart built with TypeScript
      </p>

      <div className="info-content">
        <section className="info-section">
          <h2>What Is This?</h2>
          <p>
            This is a <strong>live demo</strong> of an event-sourced shopping cart application.
            Every action you take — adding items, removing them, submitting your cart — is
            stored as an immutable event. The current state (your cart, inventories, orders)
            is always derived by replaying these events.
          </p>
          <p>
            This demo is a <strong>TypeScript port</strong> of the .NET implementation from the
            book, re-implemented using <strong>BoundlessDB</strong> as the event store and
            the <strong>Decider Pattern</strong> for command handling.
          </p>
        </section>

        <section className="info-section">
          <h2>📖 The Book</h2>
          <p>
            This demo is based on the Shopping Cart model from
            {' '}<strong>Martin Dilger's</strong> book{' '}
            <a href="https://leanpub.com/eventmodeling-and-eventsourcing" target="_blank" rel="noopener noreferrer">
              Understanding Event Sourcing
            </a>.
            The book introduces the principles of Event Sourcing and Event Modeling,
            providing practical insights and techniques to design and implement
            event-sourced systems.
          </p>
          <p>
            Available on{' '}
            <a href="https://leanpub.com/eventmodeling-and-eventsourcing" target="_blank" rel="noopener noreferrer">
              Leanpub
            </a>{' '}and{' '}
            <a href="https://www.amazon.com/Understanding-Eventsourcing-Planning-Implementing-Eventmodeling/dp/B0DNXQJM9Z" target="_blank" rel="noopener noreferrer">
              Amazon
            </a>.
          </p>
        </section>

        <section className="info-section">
          <h2>📐 Event Modeling</h2>
          <p>
            This application was designed with{' '}
            <a href="https://eventmodeling.org" target="_blank" rel="noopener noreferrer">
              Event Modeling
            </a>
            {' '}— a method for describing systems using events as the primary building
            blocks. Instead of starting with database schemas or class diagrams, you model
            the flow of information through time: what events happen, what commands trigger
            them, and what views are derived from them.
          </p>
          <p>
            The consistency boundaries in this demo follow the{' '}
            <a href="https://dcb.events" target="_blank" rel="noopener noreferrer">
              Dynamic Consistency Boundary (DCB)
            </a>
            {' '}specification — a modern approach that replaces traditional streams with
            flexible, key-based consistency. This means events can belong to multiple
            boundaries simultaneously (e.g., an ItemAdded event belongs to both a cart
            and a product boundary).
          </p>
        </section>

        <section className="info-section">
          <h2>🔀 Giraflow — The Event Model</h2>
          <p>
            The entire system was designed using <strong>Giraflow</strong>, a JSON-based
            format for Event Modeling. The model defines every event, command, state view,
            and their relationships — plus specifications (Given/When/Then) that serve as
            both documentation and test cases.
          </p>
          <p>
            <a href="https://giraflow.dev/app#https://raw.githubusercontent.com/SBortz/understanding-eventsourcing-dotnet/refs/heads/main/04-boundless-typescript/shopping.giraflow.json" target="_blank" rel="noopener noreferrer">
              🔗 View the Shopping Cart Event Model on giraflow.dev
            </a>
          </p>
          <p>
            The model contains 12 slices — each slice is a vertical feature with its own
            command, events, state views, and test scenarios. The implementation code maps
            1:1 to the model.
          </p>
        </section>

        <section className="info-section">
          <h2>💾 BoundlessDB — The Event Store</h2>
          <p>
            <a href="https://boundlessdb.dev" target="_blank" rel="noopener noreferrer">
              BoundlessDB
            </a>{' '}
            is a TypeScript event store implementing{' '}
            <a href="https://dcb.events" target="_blank" rel="noopener noreferrer">
              Dynamic Consistency Boundaries (DCB)
            </a>.
            Instead of traditional streams, events are tagged with <strong>consistency keys</strong>{' '}
            — enabling flexible querying across any dimension.
          </p>
          <div className="info-code">
            <p><strong>How it's used here:</strong></p>
            <ul>
              <li><code>cart</code> key — groups all events belonging to one cart (CartCreated, ItemAdded, ...)</li>
              <li><code>product</code> key — groups pricing and inventory events per product</li>
              <li>ItemAdded has <strong>both</strong> keys — it belongs to a cart AND references a product</li>
            </ul>
          </div>
          <p>
            This means you can query "all events for cart X" or "all events for product Y"
            without maintaining separate streams. The consistency boundaries are defined
            in a simple config, and BoundlessDB handles the rest.
          </p>
          <p>
            <a href="https://www.npmjs.com/package/boundlessdb" target="_blank" rel="noopener noreferrer">
              📦 npm: boundlessdb
            </a>
            {' · '}
            <a href="https://github.com/SBortz/boundlessdb" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </p>
        </section>

        <section className="info-section">
          <h2>🏗️ Architecture</h2>
          <div className="info-code">
            <ul>
              <li><strong>Hosting:</strong> Vercel (Serverless Functions) + Supabase (PostgreSQL)</li>
              <li><strong>Backend:</strong> TypeScript + BoundlessDB (PostgresStorage)</li>
              <li><strong>Frontend:</strong> React 19 + Vite + React Router</li>
              <li><strong>Pattern:</strong> Decider Pattern — each command handler reads events, builds state, validates, produces new events</li>
              <li><strong>Hexagonal:</strong> Shared usecases, switchable heads (Express for local dev, Vercel Functions for production)</li>
              <li><strong>Storage:</strong> Supabase PostgreSQL — BoundlessDB uses SERIALIZABLE transactions for multi-node safety</li>
              <li><strong>No ORM, no separate DB:</strong> Events are the single source of truth</li>
            </ul>
          </div>
        </section>

        <section className="info-section">
          <h2>📂 Source Code</h2>
          <p>
            <a href="https://github.com/SBortz/understanding-eventsourcing-dotnet/tree/main/04-boundless-typescript" target="_blank" rel="noopener noreferrer">
              🔗 GitHub: SBortz/understanding-eventsourcing-dotnet
            </a>
          </p>
          <p>
            The original .NET implementations (03-decider-model) are in the same repo.
            This TypeScript port demonstrates how the same Event Model can be implemented
            with a completely different tech stack.
          </p>
        </section>
      </div>
    </div>
  );
}
