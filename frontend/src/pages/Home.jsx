import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, resolveAssetUrl } from '../api.js';
import { BUSINESS_PHONE_DISPLAY, BUSINESS_LOCATION, WHATSAPP_LINK } from '../constants.js';

export default function Home() {
  const [adventures, setAdventures] = useState([]);
  const [galleryPhotos, setGalleryPhotos] = useState([]);

  useEffect(() => {
    api.getAdventures().then((data) => setAdventures(data.adventures.slice(0, 3))).catch(() => {});
    api.getGallery({ featured: 'true' }).then((data) => setGalleryPhotos(data.images.slice(0, 8))).catch(() => {});
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Explore. Experience. Conquer.</p>
          <h1>Trek Kenya's Highest Peaks with Confidence</h1>
          <p className="hero-lead">
            Guided mountain treks and hikes across Kenya — expert guides, safety-first
            acclimatization plans, and unforgettable summit sunrises.
          </p>
          <div className="hero-actions">
            <Link to="/adventures" className="btn btn-primary">Explore Adventures</Link>
            <Link to="/register" className="btn btn-outline">Create an Account</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Why Trek With Us</h2>
        <div className="grid-3">
          <div className="card">
            <h3>Expert Guides</h3>
            <p>Our guides know every route on the mountain and prioritize your safety at altitude.</p>
          </div>
          <div className="card">
            <h3>Acclimatization First</h3>
            <p>Every itinerary is built to give your body time to adjust — the summit can wait.</p>
          </div>
          <div className="card">
            <h3>Full Support</h3>
            <p>Porters, cooks, camping gear, and emergency evacuation protocols on every trek.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Featured Adventures</h2>
        <div className="grid-3">
          {adventures.map((a) => (
            <div className="card trek-card" key={a.id}>
              {a.image_url && (
                <img
                  src={resolveAssetUrl(a.image_url)}
                  alt={`${a.title} — ${a.location || 'Maqka Summit adventure'}`}
                  className="card-image"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <h3>{a.title}</h3>
              <p className="muted">{a.location} · {a.duration_days} days</p>
              <p>{a.description?.slice(0, 100)}...</p>
              <p className="price">From KSh {a.price_adult.toLocaleString()}</p>
              <Link to={`/adventures/${a.slug}`} className="btn btn-outline btn-sm">View Details</Link>
            </div>
          ))}
          {adventures.length === 0 && <p>No adventures published yet.</p>}
        </div>
      </section>

      {galleryPhotos.length > 0 && (
        <section className="section home-gallery-preview">
          <h2>Moments From The Trail</h2>
          <div className="gallery-masonry">
            {galleryPhotos.map((img) => (
              <div className="gallery-masonry-item" key={img.id} style={{ cursor: 'default' }}>
                <img
                  src={resolveAssetUrl(img.image_url)}
                  alt={img.title || 'Maqka Summit adventure photo'}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/gallery" className="btn btn-primary">View Full Gallery</Link>
          </div>
        </section>
      )}

      <section className="section cta-section">
        <h2>Ready to Start Planning?</h2>
        <p className="muted">
          Reach us in {BUSINESS_LOCATION} — call, email, or message us on WhatsApp and
          we'll help you pick the right adventure.
        </p>
        <div className="hero-actions" style={{ marginTop: 16 }}>
          <a href={`tel:${BUSINESS_PHONE_DISPLAY.replace(/\s/g, '')}`} className="btn btn-outline" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>
            Call {BUSINESS_PHONE_DISPLAY}
          </a>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="contact-whatsapp-btn">
            Chat on WhatsApp
          </a>
          <Link to="/contact" className="btn btn-primary">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}
