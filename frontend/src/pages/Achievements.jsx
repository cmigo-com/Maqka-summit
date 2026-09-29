import React, { useEffect, useState } from 'react';
import { api, resolveAssetUrl } from '../api.js';

export default function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAchievements().then((data) => setAchievements(data.achievements)).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="section">
      <h1>Our Achievements</h1>
      <p className="muted">Milestones from the trail, as Maqka Summit grows.</p>
      {error && <p className="error">{error}</p>}

      {achievements.length === 0 && !error && (
        <div className="empty-state">
          <h3>Achievements coming soon</h3>
          <p className="muted">We're building our track record — check back as we add verified milestones here.</p>
        </div>
      )}

      <div className="grid-3">
        {achievements.map((a) => (
          <div className="card" key={a.id}>
            {a.image_url && (
              <img src={resolveAssetUrl(a.image_url)} alt={a.title} className="card-image" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            )}
            {a.category && <p className="muted small">{a.category}{a.year ? ` · ${a.year}` : ''}</p>}
            <h3>{a.title}</h3>
            {a.description && <p>{a.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
