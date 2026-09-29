import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, resolveAssetUrl } from '../api.js';

const DIFFICULTIES = ['', 'Easy', 'Moderate', 'Challenging', 'Strenuous'];
const DURATIONS = [
  { label: 'Any duration', min: '', max: '' },
  { label: '1–2 Days', min: 1, max: 2 },
  { label: '3–4 Days', min: 3, max: 4 },
  { label: '5+ Days', min: 5, max: '' },
];

const EMPTY_FILTERS = {
  q: '', mountain: '', category: '', county: '', difficulty: '', duration: '0',
  price_min: '', price_max: '', departure_date: '', featured: false,
};

export default function Adventures() {
  const [adventures, setAdventures] = useState([]);
  const [mountains, setMountains] = useState([]);
  const [filterMeta, setFilterMeta] = useState({ categories: [], counties: [] });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMountains().then((data) => setMountains(data.mountains)).catch(() => {});
    api.getAdventureFilters().then(setFilterMeta).catch(() => {});
  }, []);

  function load(activeFilters) {
    setLoading(true);
    const duration = DURATIONS[Number(activeFilters.duration || 0)];
    const params = {
      type: 'trek',
      q: activeFilters.q,
      mountain: activeFilters.mountain,
      category: activeFilters.category,
      county: activeFilters.county,
      difficulty: activeFilters.difficulty,
      duration_min: duration.min,
      duration_max: duration.max,
      price_min: activeFilters.price_min,
      price_max: activeFilters.price_max,
      departure_date: activeFilters.departure_date,
      featured: activeFilters.featured ? 'true' : '',
    };
    api.getAdventures(params)
      .then((data) => { setAdventures(data.adventures); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(EMPTY_FILTERS); }, []);

  function updateFilter(field, value) {
    setFilters((f) => ({ ...f, [field]: value }));
  }

  function handleSearch(e) {
    e.preventDefault();
    load(filters);
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    load(EMPTY_FILTERS);
  }

  return (
    <div className="section">
      <h1>Our Adventures</h1>

      <form className="search-panel" onSubmit={handleSearch}>
        <input
          type="text"
          className="search-input"
          placeholder="Search mountains, routes or adventures..."
          value={filters.q}
          onChange={(e) => updateFilter('q', e.target.value)}
        />

        <div className="filter-grid">
          <label>
            Mountain
            <select value={filters.mountain} onChange={(e) => updateFilter('mountain', e.target.value)}>
              <option value="">All Mountains</option>
              {mountains.map((m) => <option key={m.id} value={m.slug}>{m.name}</option>)}
            </select>
          </label>

          <label>
            Category
            <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}>
              <option value="">All Categories</option>
              {filterMeta.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label>
            County
            <select value={filters.county} onChange={(e) => updateFilter('county', e.target.value)}>
              <option value="">All Counties</option>
              {filterMeta.counties.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label>
            Difficulty
            <select value={filters.difficulty} onChange={(e) => updateFilter('difficulty', e.target.value)}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d || 'All'}</option>)}
            </select>
          </label>

          <label>
            Duration
            <select value={filters.duration} onChange={(e) => updateFilter('duration', e.target.value)}>
              {DURATIONS.map((d, i) => <option key={d.label} value={i}>{d.label}</option>)}
            </select>
          </label>

          <label>
            Min Price (KSh)
            <input type="number" min="0" value={filters.price_min} onChange={(e) => updateFilter('price_min', e.target.value)} />
          </label>

          <label>
            Max Price (KSh)
            <input type="number" min="0" value={filters.price_max} onChange={(e) => updateFilter('price_max', e.target.value)} />
          </label>

          <label>
            Departure Date
            <input type="date" value={filters.departure_date} onChange={(e) => updateFilter('departure_date', e.target.value)} />
          </label>

          <label className="checkbox-label">
            <input type="checkbox" checked={filters.featured} onChange={(e) => updateFilter('featured', e.target.checked)} />
            Featured adventures only
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={handleReset}>Reset Filters</button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {!loading && adventures.length === 0 && !error && (
        <div className="empty-state">
          <h3>No adventures match your search</h3>
          <p className="muted">Try widening your filters — a lower minimum price, a longer duration range, or clearing the departure date.</p>
          <button className="btn btn-outline btn-sm" onClick={handleReset}>Clear all filters</button>
        </div>
      )}

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
            {a.is_featured ? <span className="status-badge status-confirmed" style={{ marginBottom: 6, display: 'inline-block' }}>Featured</span> : null}
            <h3>{a.title}</h3>
            <p className="muted">
              {a.category ? `${a.category} · ` : ''}{a.county ? `${a.county} · ` : ''}{a.duration_days} days · {a.difficulty}
            </p>
            <p>{a.description?.slice(0, 120)}...</p>
            <p className="price">Adult: KSh {a.price_adult.toLocaleString()} {a.price_child ? `· Child: KSh ${a.price_child.toLocaleString()}` : ''}</p>
            <p className="muted">{a.tripDates?.length || 0} upcoming departure(s)</p>
            <Link to={`/adventures/${a.slug}`} className="btn btn-primary btn-sm">View & Book</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
