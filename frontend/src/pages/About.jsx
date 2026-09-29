import React from 'react';
import { Link } from 'react-router-dom';
import { BUSINESS_PHONE_DISPLAY, BUSINESS_EMAIL, BUSINESS_LOCATION } from '../constants.js';

export default function About() {
  return (
    <div className="section">
      <h1>About Maqka Summit</h1>
      <p>
        Maqka Summit is a Kenyan hiking and mountain trekking company offering guided
        adventures from easy day hikes near Nairobi to multi-day expeditions up Mount Kenya
        and Kenya's more remote peaks. Every trek is led by experienced local guides who
        know the terrain, the weather patterns, and how to keep a group safe at altitude.
      </p>
      <p>
        We started this company out of a love for Kenya's mountains and a belief that a
        good trek is about more than reaching the summit — it's about the guides you climb
        with, the pace you set, and the care taken over acclimatization along the way.
      </p>
      <h2>Our Approach</h2>
      <ul>
        <li>Small group sizes for a more personal experience</li>
        <li>Acclimatization-first itineraries — the summit can wait</li>
        <li>Experienced guides, porters and cooks on every multi-day trek</li>
        <li>Transparent pricing with no hidden fees</li>
      </ul>

      <div className="card" style={{ marginTop: 24, maxWidth: 420 }}>
        <h3>Find Us</h3>
        <p className="muted">{BUSINESS_LOCATION}</p>
        <p>Phone: {BUSINESS_PHONE_DISPLAY}</p>
        <p>Email: {BUSINESS_EMAIL}</p>
        <p><Link to="/contact">Get in touch →</Link></p>
      </div>
    </div>
  );
}
