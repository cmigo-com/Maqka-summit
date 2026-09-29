import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api.js';

const EMPTY_FORM = { title: '', category: '', year: '', description: '', image_url: '' };

export default function AdminAchievements() {
  const { token } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api.getAllAchievements(token).then((data) => setAchievements(data.achievements)).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, [token]);

  function startEdit(a) {
    setEditingId(a.id);
    setForm({ title: a.title, category: a.category || '', year: a.year || '', description: a.description || '', image_url: a.image_url || '' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await api.updateAchievement(editingId, form, token);
      else await api.createAchievement(form, token);
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive(a) {
    try { await api.updateAchievement(a.id, { is_active: !a.is_active }, token); load(); } catch (e) { setError(e.message); }
  }

  async function handleDelete(a) {
    if (!confirm('Delete this achievement?')) return;
    try { await api.deleteAchievement(a.id, token); load(); } catch (e) { setError(e.message); }
  }

  return (
    <div>
      <p className="muted">Only add achievements, numbers, or partnerships you can verify — nothing here should be invented.</p>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>{editingId ? 'Edit Achievement' : 'Add New Achievement'}</h3>
        <form onSubmit={handleSubmit} className="form form-grid">
          <label>Title <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 500+ Hikers Guided" /></label>
          <label>Category <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Hikers Served" /></label>
          <label>Year <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></label>
          <label>Image URL <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></label>
          <label className="full-width">Description <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="form-actions full-width">
            <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Add Achievement'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <h3>All Achievements</h3>
      <div className="admin-trek-list">
        {achievements.map((a) => (
          <div className="card" key={a.id}>
            <div className="booking-card-header">
              <h4>{a.title} {!a.is_active && <span className="status-badge status-cancelled">Inactive</span>}</h4>
              <div>
                <button className="btn-link" onClick={() => startEdit(a)}>Edit</button>
                <button className="btn-link" onClick={() => toggleActive(a)}>{a.is_active ? 'Deactivate' : 'Activate'}</button>
                <button className="btn-link danger" onClick={() => handleDelete(a)}>Delete</button>
              </div>
            </div>
            <p className="muted">{a.category}{a.year ? ` · ${a.year}` : ''}</p>
            {a.description && <p>{a.description}</p>}
          </div>
        ))}
        {achievements.length === 0 && <p>No achievements added yet.</p>}
      </div>
    </div>
  );
}
