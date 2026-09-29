import React, { useEffect, useMemo, useState } from 'react';
import { api, resolveAssetUrl } from '../api.js';

const FILTER_GROUPS = [
  { key: 'ALL', label: 'All', categories: null },
  { key: 'MOUNTAINS', label: 'Mountains', categories: ['Mount Kenya', 'Mount Longonot', 'Ngong Hills', 'Mt Kilimambogo', 'Aberdare', 'Menengai'] },
  { key: 'HIKES', label: 'Hikes', categories: ['Hiking Adventures', "Hell's Gate"] },
  { key: 'WATERFALLS', label: 'Waterfalls', categories: ['Waterfalls'] },
  { key: 'FORESTS', label: 'Forests', categories: ['Karura Forest', 'Forest Trails'] },
  { key: 'EXPERIENCES', label: 'Experiences', categories: ['Team & Guides', 'Maqka Summit Experiences'] },
];

function Lightbox({ images, index, onClose, onPrev, onNext }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  const img = images[index];
  if (!img) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">×</button>
      <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Previous photo">‹</button>
      <img
        src={resolveAssetUrl(img.image_url)}
        alt={img.title || 'Maqka Summit adventure photo'}
        className="lightbox-image"
        onClick={(e) => e.stopPropagation()}
      />
      <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Next photo">›</button>
      {(img.title || img.description) && (
        <div className="lightbox-caption" onClick={(e) => e.stopPropagation()}>
          {img.title && <strong>{img.title}</strong>}
          {img.description && <p>{img.description}</p>}
        </div>
      )}
    </div>
  );
}

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getGallery().then((data) => setImages(data.images)).catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const group = FILTER_GROUPS.find((g) => g.key === activeFilter);
    if (!group || !group.categories) return images;
    return images.filter((img) => group.categories.includes(img.category));
  }, [images, activeFilter]);

  return (
    <div className="section">
      <h1>Explore Our Adventures</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 24 }}>
        Real moments, real trails, unforgettable experiences.
      </p>

      <div className="gallery-filters">
        {FILTER_GROUPS.map((g) => (
          <button
            key={g.key}
            className={`filter-pill ${activeFilter === g.key ? 'filter-pill-active' : ''}`}
            onClick={() => setActiveFilter(g.key)}
          >
            {g.label.toUpperCase()}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {filtered.length === 0 && !error && (
        <div className="empty-state">
          <h3>No photos in this category yet</h3>
          <p className="muted">Check back soon — we're adding more Maqka Summit photos regularly.</p>
        </div>
      )}

      <div className="gallery-masonry">
        {filtered.map((img, i) => (
          <button
            key={img.id}
            className="gallery-masonry-item"
            onClick={() => setLightboxIndex(i)}
            aria-label={`Open photo: ${img.title || 'Maqka Summit adventure photo'}`}
          >
            <img
              src={resolveAssetUrl(img.image_url)}
              alt={img.title || `Maqka Summit ${img.category || 'adventure'} photo`}
              loading="lazy"
            />
            {img.title && <span className="gallery-item-caption">{img.title}</span>}
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={filtered}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i - 1 + filtered.length) % filtered.length)}
          onNext={() => setLightboxIndex((i) => (i + 1) % filtered.length)}
        />
      )}
    </div>
  );
}
