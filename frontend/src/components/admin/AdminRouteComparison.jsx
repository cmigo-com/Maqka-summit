import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api.js';

const EMPTY_FORM = {
  title: '', duration_label: '', route: '', difficulty: '', summit_objective: '', recommended_experience: '',
  price_adult: '', price_child: '', availability_note: '', linked_adventure_id: '', whatsapp_message: '',
};

export default function AdminRouteComparison() {
  const { token } = useAuth();
  const [cards, setCards] = useState([]);
  const [adventures, setAdventures] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api.getAllRouteComparisonCards(token).then((d) => setCards(d.cards)).catch((e) => setError(e.message));
    api.getAdventures().then((d) => setAdventures(d.adventures)).catch(() => {});
  }
  useEffect(() => { load(); }, [token]);

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      title: c.title, duration_label: c.duration_label || '', route: c.route || '', difficulty: c.difficulty || '',
      summit_objective: c.summit_objective || '', recommended_experience: c.recommended_experience || '',
      price_adult: c.price_adult || '', price_child: c.price_child || '', availability_note: c.availability_note || '',
      linked_adventure_id: c.linked_adventure_id || '', whatsapp_message: c.whatsapp_message || '',
    });
  }
  function resetForm() { setEditingId(null); setForm(EMPTY_FORM); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      price_adult: form.price_adult ? Number(form.price_adult) : null,
      price_child: form.price_child ? Number(form.price_child) : null,
      linked_adventure_id: form.linked_adventure_id || null,
    };
    try {
      if (editingId) await api.updateRouteComparisonCard(editingId, payload, token);
      else await api.createRouteComparisonCard(payload, token);
      resetForm(); load();
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(c) {
    if (!confirm(`Delete "${c.title}"?`)) return;
    try { await api.deleteRouteComparisonCard(c.id, token); load(); } catch (e) { setError(e.message); }
  }

  return (
    <div>
      <p className="muted">Powers the "Compare Your Options" cards on the Mount Kenya destination page. Leave price blank until verified — the card will show "Contact us for current pricing" instead.</p>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <h3>{editingId ? 'Edit Card' : 'Add Comparison Card'}</h3>
        <form onSubmit={handleSubmit} className="form form-grid">
          <label>Title <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>Duration label <input value={form.duration_label} onChange={(e) => setForm({ ...form, duration_label: e.target.value })} /></label>
          <label>Route <input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} /></label>
          <label>Difficulty <input value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} /></label>
          <label>Summit objective <input value={form.summit_objective} onChange={(e) => setForm({ ...form, summit_objective: e.target.value })} /></label>
          <label>Recommended experience <input value={form.recommended_experience} onChange={(e) => setForm({ ...form, recommended_experience: e.target.value })} /></label>
          <label>Price - Adult (KSh, optional) <input type="number" value={form.price_adult} onChange={(e) => setForm({ ...form, price_adult: e.target.value })} /></label>
          <label>Price - Child (KSh, optional) <input type="number" value={form.price_child} onChange={(e) => setForm({ ...form, price_child: e.target.value })} /></label>
          <label>
            Link to existing adventure (for Book Now)
            <select value={form.linked_adventure_id} onChange={(e) => setForm({ ...form, linked_adventure_id: e.target.value })}>
              <option value="">— None (WhatsApp enquiry only) —</option>
              {adventures.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </label>
          <label className="full-width">Availability note <input value={form.availability_note} onChange={(e) => setForm({ ...form, availability_note: e.target.value })} /></label>
          <label className="full-width">WhatsApp enquiry message <input value={form.whatsapp_message} onChange={(e) => setForm({ ...form, whatsapp_message: e.target.value })} /></label>
          <div className="form-actions full-width">
            <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add Card'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>
      <h3>All Cards</h3>
      <div className="admin-trek-list">
        {cards.map((c) => (
          <div className="card" key={c.id}>
            <div className="booking-card-header">
              <h4>{c.title}</h4>
              <div>
                <button className="btn-link" onClick={() => startEdit(c)}>Edit</button>
                <button className="btn-link danger" onClick={() => handleDelete(c)}>Delete</button>
              </div>
            </div>
            <p className="muted">{c.duration_label} {c.linkedAdventure ? `· Linked to: ${c.linkedAdventure.title}` : '· No linked adventure'}</p>
            <p className="muted small">{c.price_adult ? `KSh ${c.price_adult.toLocaleString()}` : 'No price set'}</p>
          </div>
        ))}
        {cards.length === 0 && <p>No cards yet.</p>}
      </div>
    </div>
  );
}
