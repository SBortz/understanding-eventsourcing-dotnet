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
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Admin
          </NavLink>
          <NavLink to="/explorer" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Explorer
          </NavLink>
          <NavLink to="/info" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Info
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
