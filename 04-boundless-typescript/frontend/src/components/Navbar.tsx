import { NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
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
            Cart
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Admin
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
