import React from 'react';
import { Link } from 'react-router-dom';
import { WHATSAPP_LINK } from '../constants.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand-row">
            <img src="/images/brand/logo-icon.png" alt="Maqka Summit" className="footer-logo-icon" />
            <h4>Maqka Summit</h4>
          </div>
          <p>Explore. Experience. Conquer.</p>
          <p>Nanyuki, Kenya</p>
        </div>
        <div>
          <h5>Contact</h5>
          <p>Phone: 0713 177 186</p>
          <p>Email: waltermichael357@gmail.com</p>
          <p><a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="footer-link">WhatsApp</a> · <Link to="/contact" className="footer-link">Contact Us</Link></p>
        </div>
        <div>
          <h5>Quick Links</h5>
          <p><Link to="/" className="footer-link">Home</Link></p>
          <p><Link to="/adventures" className="footer-link">Adventures</Link></p>
          <p><Link to="/about" className="footer-link">About Us</Link></p>
          <p><Link to="/gallery" className="footer-link">Gallery</Link></p>
          <p><Link to="/contact" className="footer-link">Contact</Link></p>
          <p><Link to="/login" className="footer-link">Login</Link> / <Link to="/register" className="footer-link">Register</Link></p>
        </div>
        <div>
          <h5>Payments</h5>
          <p>Bank transfer or cash on booking confirmation.</p>
        </div>
      </div>
      <p className="footer-copy">© {new Date().getFullYear()} Maqka Summit Adventures and Tours. All rights reserved.</p>
    </footer>
  );
}
