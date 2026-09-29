import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api.js';

const EMPTY_FORM = { name: '', slug: '', region: '', description: '', image_url: '', highlightsText: '' };

export default function AdminDestinations() {
  const { token } = useAuth();
  const [mountains, setMountains] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api.getMountains().then((data) => setMountains(data.mountains)).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  function startEdit(m) {
    setEditingId(m.id);
    setForm({
      name: m.name, slug: m.slug, region: m.region || '', description: m.description || '',
      image_url: m.image_url || '', highlightsText: (m.highlights || []).join('\n'),
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
      name: form.name, slug: form.slug, region: form.region, description: form.description, image_url: form.image_url,
      highlights: form.highlightsText.split('\n').map((h) => h.trim()).filter(Boolean),
    };
    try {
      if (editingId) await api.updateMountain(editingId, payload, token);
      else await api.createMountain(payload, token);
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(m) {
    if (!confirm(`Delete "${m.name}"? Adventures linked to it will keep their data but lose this destination link.`)) return;
    try { await api.deleteMountain(m.id, token); load(); } catch (e) { setError(e.message); }
  }

  return (
    <div>
      <p className="muted">These power the public "Our Destinations" page and the Mountain dropdown when creating an adventure.</p>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>{editingId ? 'Edit Destination' : 'Add New Destination'}</h3>
        <form onSubmit={handleSubmit} className="form form-grid">
          <label>Name <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Slug (url) <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
          <label>Region <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></label>
          <label>Image URL <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></label>
          <label className="full-width">Description <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="full-width">
            Highlights (one per line)
            <textarea rows={3} value={form.highlightsText} onChange={(e) => setForm({ ...form, highlightsText: e.target.value })} />
          </label>
          <div className="form-actions full-width">
            <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Add Destination'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <h3>All Destinations</h3>
      <div className="admin-trek-list">
        {mountains.map((m) => (
          <div className="card" key={m.id}>
            <div className="booking-card-header">
              <h4>{m.name}</h4>
              <div>
                <button className="btn-link" onClick={() => startEdit(m)}>Edit</button>
                <button className="btn-link danger" onClick={() => handleDelete(m)}>Delete</button>
              </div>
            </div>
            <p className="muted">{m.region}</p>
          </div>
        ))}
        {mountains.length === 0 && <p>No destinations yet.</p>}
      </div>
    </div>
  );
}
