import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, resolveAssetUrl } from '../api.js';
import MountKenyaGuide from '../components/MountKenyaGuide.jsx';

export default function DestinationDetail() {
  const { slug } = useParams();
  const [mountain, setMountain] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMountain(slug).then((data) => setMountain(data.mountain)).catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <p className="error section">{error}</p>;
  if (!mountain) return <p className="section">Loading destination...</p>;

  return (
    <div className="section trek-detail">
      <Link to="/destinations" className="back-link">← Back to Destinations</Link>
      <h1>{mountain.name}</h1>
      <p className="muted">{mountain.region}</p>
      {mountain.image_url && (
        <img
          src={resolveAssetUrl(mountain.image_url)}
          alt={`${mountain.name} — ${mountain.region || 'Maqka Summit destination'}`}
          className="detail-hero-image"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <p>{mountain.description}</p>

      {mountain.highlights?.length > 0 && (
        <>
          <h3>Highlights</h3>
          <ul>{mountain.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
        </>
      )}

      <h3>Available Adventures</h3>
      <div className="grid-3">
        {mountain.adventures?.map((a) => (
          <div className="card trek-card" key={a.id}>
            {a.image_url && <img src={resolveAssetUrl(a.image_url)} alt={a.title} className="card-image" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
            <h4>{a.title}</h4>
            <p className="muted">{a.duration_days} days · {a.difficulty}</p>
            <p className="price">From KSh {a.price_adult.toLocaleString()}</p>
            <Link to={`/adventures/${a.slug}`} className="btn btn-primary btn-sm">View Details</Link>
          </div>
        ))}
        {(!mountain.adventures || mountain.adventures.length === 0) && (
          <p className="muted">No adventures listed for this destination yet.</p>
        )}
      </div>

      {mountain.slug === 'mount-kenya' && <MountKenyaGuide />}
    </div>
  );
}
