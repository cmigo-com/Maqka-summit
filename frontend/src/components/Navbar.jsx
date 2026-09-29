import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate('/');
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand" onClick={closeMenu}>
          <img src="/images/brand/logo-icon.png" alt="Maqka Summit" className="brand-icon" />
          <span className="brand-text">
            <span className="brand-title">MAQKA SUMMIT</span>
            <span className="brand-sub">Adventures and Tours</span>
          </span>
        </Link>

        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>

        <nav className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to="/about" onClick={closeMenu}>About Us</Link>
          <Link to="/adventures" onClick={closeMenu}>Adventures</Link>
          <Link to="/destinations" onClick={closeMenu}>Destinations</Link>
          <Link to="/safari-packages" onClick={closeMenu}>Safari Packages</Link>
          <Link to="/gallery" onClick={closeMenu}>Gallery</Link>
          <Link to="/achievements" onClick={closeMenu}>Achievements</Link>
          <Link to="/faq" onClick={closeMenu}>FAQ</Link>
          <Link to="/contact" onClick={closeMenu}>Contact</Link>
          {!user && <Link to="/login" onClick={closeMenu}>Login</Link>}
          {!user && <Link to="/register" className="btn-link" onClick={closeMenu}>Sign Up</Link>}
          {user && user.role === 'customer' && <Link to="/dashboard" onClick={closeMenu}>My Bookings</Link>}
          {user && user.role === 'admin' && <Link to="/admin" onClick={closeMenu}>Admin</Link>}
          {user && (
            <button className="btn-link" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
