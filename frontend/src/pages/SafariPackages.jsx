import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, resolveAssetUrl } from '../api.js';

export default function SafariPackages() {
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAdventures({ type: 'safari' }).then((data) => setPackages(data.adventures)).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="section">
      <h1>Safari Packages</h1>
      <p className="muted">Wildlife and travel packages alongside our hiking and trekking adventures.</p>
      {error && <p className="error">{error}</p>}

      {packages.length === 0 && !error && (
        <div className="empty-state">
          <h3>No safari packages published yet</h3>
          <p className="muted">Check back soon, or contact us directly if you're interested in a custom safari.</p>
        </div>
      )}

      <div className="grid-3">
        {packages.map((p) => (
          <div className="card trek-card" key={p.id}>
            {p.image_url && (
              <img src={resolveAssetUrl(p.image_url)} alt={p.title} className="card-image" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            )}
            <h3>{p.title}</h3>
            <p className="muted">{p.location} · {p.duration_days} days</p>
            <p>{p.description?.slice(0, 120)}...</p>
            <p className="price">Adult: KSh {p.price_adult.toLocaleString()} {p.price_child ? `· Child: KSh ${p.price_child.toLocaleString()}` : ''}</p>
            <Link to={`/adventures/${p.slug}`} className="btn btn-primary btn-sm">View & Book</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
