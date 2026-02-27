import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { fetchCartItems } from '../api';
import { getCartId } from '../cartId';
import './Navbar.css';

export default function Navbar() {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    const poll = () => {
      fetchCartItems(getCartId())
        .then(cart => setItemCount(cart?.items?.length ?? 0))
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          🛒 Shopping Cart
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
            Catalog
          </NavLink>
          <NavLink to="/cart" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Cart{itemCount > 0 ? ` (${itemCount})` : ''}
          </NavLink>

          <span className="nav-separator" />

          <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-item demo active' : 'nav-item demo'}>
            Admin
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => isActive ? 'nav-item demo active' : 'nav-item demo'}>
            Events
          </NavLink>
          <NavLink to="/state" className={({ isActive }) => isActive ? 'nav-item demo active' : 'nav-item demo'}>
            State Views
          </NavLink>
          <NavLink to="/info" className={({ isActive }) => isActive ? 'nav-item demo active' : 'nav-item demo'}>
            Info
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
