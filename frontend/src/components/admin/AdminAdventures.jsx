import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api.js';

const EMPTY_FORM = {
  type: 'trek', title: '', slug: '', mountain_id: '', category: '', county: '', location: '', route: '', duration_days: 1, difficulty: 'Moderate',
  max_altitude_m: '', price_adult: '', price_child: '', max_guests: 20, description: '', accommodation: '', meals: '', transport: '',
  meeting_point: '', image_url: '', is_featured: false,
};

const CATEGORIES = ['Mountain', 'Mountain Range', 'Hill Range', 'Forest', 'Waterfall', 'Escarpment', 'Nature Trail', 'Crater', 'National Park', 'Island', 'Lake'];

export default function AdminAdventures() {
  const { token } = useAuth();
  const [adventures, setAdventures] = useState([]);
  const [mountains, setMountains] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [tripForm, setTripForm] = useState({});

  function load() {
    api.getAdventures().then((data) => setAdventures(data.adventures)).catch((e) => setError(e.message));
    api.getMountains().then((data) => setMountains(data.mountains)).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  function updateForm(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(a) {
    setEditingId(a.id);
    setForm({
      type: a.type || 'trek', title: a.title, slug: a.slug, mountain_id: a.mountain_id || '', category: a.category || '', county: a.county || '',
      location: a.location || '', route: a.route || '',
      duration_days: a.duration_days || 1, difficulty: a.difficulty || 'Moderate',
      max_altitude_m: a.max_altitude_m || '', price_adult: a.price_adult, price_child: a.price_child || '',
      max_guests: a.max_guests || 20, description: a.description || '', accommodation: a.accommodation || '', meals: a.meals || '', transport: a.transport || '',
      meeting_point: a.meeting_point || '',
      image_url: a.image_url || '', is_featured: !!a.is_featured,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      mountain_id: form.mountain_id || null,
      duration_days: Number(form.duration_days),
      max_altitude_m: form.max_altitude_m ? Number(form.max_altitude_m) : null,
      price_adult: Number(form.price_adult),
      price_child: form.price_child ? Number(form.price_child) : null,
      max_guests: Number(form.max_guests),
    };
    try {
      if (editingId) {
        await api.updateAdventure(editingId, payload, token);
      } else {
        await api.createAdventure(payload, token);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(a) {
    if (!confirm(`Deactivate "${a.title}"?`)) return;
    try {
      await api.deleteAdventure(a.id, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddTripDate(adventureId) {
    const t = tripForm[adventureId];
    if (!t?.start_date || !t?.end_date || !t?.slots_available) {
      setError('Fill in start date, end date and slots to add a trip date.');
      return;
    }
    try {
      await api.addTripDate(adventureId, {
        start_date: t.start_date,
        end_date: t.end_date,
        slots_available: Number(t.slots_available),
      }, token);
      setTripForm((f) => ({ ...f, [adventureId]: {} }));
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>{editingId ? 'Edit Adventure' : 'Add New Adventure'}</h3>
        <form onSubmit={handleSubmit} className="form form-grid">
          <label>
            Type
            <select value={form.type} onChange={(e) => updateForm('type', e.target.value)}>
              <option value="trek">Hiking/Trekking Adventure</option>
              <option value="safari">Safari Package</option>
            </select>
          </label>
          <label>Title <input required value={form.title} onChange={(e) => updateForm('title', e.target.value)} /></label>
          <label>Slug (url) <input required value={form.slug} onChange={(e) => updateForm('slug', e.target.value)} /></label>
          <label>
            Mountain
            <select value={form.mountain_id} onChange={(e) => updateForm('mountain_id', e.target.value)}>
              <option value="">— None —</option>
              {mountains.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label>Location <input value={form.location} onChange={(e) => updateForm('location', e.target.value)} /></label>
          <label>Route <input value={form.route} onChange={(e) => updateForm('route', e.target.value)} /></label>
          <label>
            Category
            <select value={form.category} onChange={(e) => updateForm('category', e.target.value)}>
              <option value="">— Select —</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>County <input value={form.county} onChange={(e) => updateForm('county', e.target.value)} placeholder="e.g. Nakuru" /></label>
          <label>Duration (days) <input type="number" min="1" value={form.duration_days} onChange={(e) => updateForm('duration_days', e.target.value)} /></label>
          <label>
            Difficulty
            <select value={form.difficulty} onChange={(e) => updateForm('difficulty', e.target.value)}>
              <option>Easy</option><option>Moderate</option><option>Challenging</option><option>Strenuous</option>
            </select>
          </label>
          <label>Max altitude (m) <input type="number" value={form.max_altitude_m} onChange={(e) => updateForm('max_altitude_m', e.target.value)} /></label>
          <label>Price - Adult (KSh) <input required type="number" value={form.price_adult} onChange={(e) => updateForm('price_adult', e.target.value)} /></label>
          <label>Price - Child (KSh) <input type="number" value={form.price_child} onChange={(e) => updateForm('price_child', e.target.value)} /></label>
          <label>Max guests <input type="number" value={form.max_guests} onChange={(e) => updateForm('max_guests', e.target.value)} /></label>
          <label>Meeting point <input value={form.meeting_point} onChange={(e) => updateForm('meeting_point', e.target.value)} /></label>
          <label>Image URL <input value={form.image_url} onChange={(e) => updateForm('image_url', e.target.value)} /></label>
          <label className="full-width">
            Description
            <textarea rows={3} value={form.description} onChange={(e) => updateForm('description', e.target.value)} />
          </label>
          {form.type === 'safari' && (
            <>
              <label>Accommodation <input value={form.accommodation} onChange={(e) => updateForm('accommodation', e.target.value)} placeholder="e.g. Tented camp, full board" /></label>
              <label>Meals <input value={form.meals} onChange={(e) => updateForm('meals', e.target.value)} placeholder="e.g. Full board" /></label>
              <label>Transport <input value={form.transport} onChange={(e) => updateForm('transport', e.target.value)} placeholder="e.g. 4x4 safari van" /></label>
            </>
          )}
          <label className="checkbox-label full-width">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => updateForm('is_featured', e.target.checked)} />
            Featured adventure (shown first, highlighted on the Adventures page)
          </label>
          <div className="form-actions full-width">
            <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create Adventure'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel Edit</button>}
          </div>
        </form>
      </div>

      <h3>Existing Adventures</h3>
      <div className="admin-trek-list">
        {adventures.map((a) => (
          <div className="card" key={a.id}>
            <div className="booking-card-header">
              <h4>{a.title} {a.type === 'safari' ? <span className="status-badge status-confirmed">Safari</span> : null} {a.is_featured ? <span className="status-badge status-confirmed">Featured</span> : null}</h4>
              <div>
                <button className="btn-link" onClick={() => startEdit(a)}>Edit</button>
                <button className="btn-link danger" onClick={() => handleDelete(a)}>Deactivate</button>
              </div>
            </div>
            <p className="muted">
              {a.category ? `${a.category} · ` : ''}{a.county ? `${a.county} · ` : ''}
              {a.mountain?.name ? `${a.mountain.name} · ` : ''}{a.location} · {a.duration_days} days · KSh {a.price_adult.toLocaleString()}
            </p>

            <p className="small-heading">Upcoming trip dates</p>
            <ul className="departure-list">
              {a.tripDates?.map((d) => (
                <li key={d.id}>{d.start_date} → {d.end_date} ({d.slots_available} slots)</li>
              ))}
              {(!a.tripDates || a.tripDates.length === 0) && <li className="muted">None scheduled</li>}
            </ul>

            <div className="form-row small-form">
              <input
                type="date"
                value={tripForm[a.id]?.start_date || ''}
                onChange={(e) => setTripForm((f) => ({ ...f, [a.id]: { ...f[a.id], start_date: e.target.value } }))}
              />
              <input
                type="date"
                value={tripForm[a.id]?.end_date || ''}
                onChange={(e) => setTripForm((f) => ({ ...f, [a.id]: { ...f[a.id], end_date: e.target.value } }))}
              />
              <input
                type="number"
                placeholder="Slots"
                min="1"
                value={tripForm[a.id]?.slots_available || ''}
                onChange={(e) => setTripForm((f) => ({ ...f, [a.id]: { ...f[a.id], slots_available: e.target.value } }))}
              />
              <button className="btn btn-sm btn-outline" onClick={() => handleAddTripDate(a.id)}>Add Date</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
