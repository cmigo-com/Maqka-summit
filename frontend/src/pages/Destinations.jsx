import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, resolveAssetUrl } from '../api.js';

export default function Destinations() {
  const [mountains, setMountains] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMountains().then((data) => setMountains(data.mountains)).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="section">
      <h1>Our Destinations</h1>
      <p className="muted">The hiking and trekking destinations Maqka Summit guides across Kenya.</p>
      {error && <p className="error">{error}</p>}
      <div className="grid-3">
        {mountains.map((m) => (
          <div className="card trek-card" key={m.id}>
            {m.image_url && (
              <img
                src={resolveAssetUrl(m.image_url)}
                alt={`${m.name} — ${m.region || 'Maqka Summit destination'}`}
                className="card-image"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <h3>{m.name}</h3>
            <p className="muted">{m.region}</p>
            <p>{m.description}</p>
            {m.highlights?.length > 0 && (
              <ul>
                {m.highlights.slice(0, 3).map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            )}
            <Link to={`/destinations/${m.slug}`} className="btn btn-primary btn-sm">View Destination</Link>
          </div>
        ))}
        {mountains.length === 0 && !error && <p>No destinations published yet.</p>}
      </div>
    </div>
  );
}
