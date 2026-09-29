import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api.js';

export default function AdminChecklist() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ question: '', why_it_matters: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api.getAllChecklist(token).then((d) => setItems(d.items)).catch((e) => setError(e.message));
  }
  useEffect(() => { load(); }, [token]);

  function startEdit(i) { setEditingId(i.id); setForm({ question: i.question, why_it_matters: i.why_it_matters }); }
  function resetForm() { setEditingId(null); setForm({ question: '', why_it_matters: '' }); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await api.updateChecklistItem(editingId, form, token);
      else await api.createChecklistItem(form, token);
      resetForm(); load();
    } catch (err) { setError(err.message); }
  }

  async function toggleActive(i) {
    try { await api.updateChecklistItem(i.id, { is_active: !i.is_active }, token); load(); } catch (e) { setError(e.message); }
  }
  async function handleDelete(i) {
    if (!confirm('Delete this checklist item?')) return;
    try { await api.deleteChecklistItem(i.id, token); load(); } catch (e) { setError(e.message); }
  }
  async function move(i, direction) {
    const index = items.findIndex((x) => x.id === i.id);
    const swap = items[index + direction];
    if (!swap) return;
    const order = items.map((x) => x.id);
    [order[index], order[index + direction]] = [order[index + direction], order[index]];
    try { await api.reorderChecklist(order, token); load(); } catch (e) { setError(e.message); }
  }

  return (
    <div>
      <p className="muted">Powers the "Questions to Ask Before Booking" section on the Mount Kenya destination page.</p>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <h3>{editingId ? 'Edit Item' : 'Add Checklist Item'}</h3>
        <form onSubmit={handleSubmit} className="form">
          <label>Question <input required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></label>
          <label>Why it matters <textarea required rows={2} value={form.why_it_matters} onChange={(e) => setForm({ ...form, why_it_matters: e.target.value })} /></label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>
      <h3>All Items</h3>
      <div className="admin-trek-list">
        {items.map((i, idx) => (
          <div className="card" key={i.id}>
            <div className="booking-card-header">
              <h4>{i.question} {!i.is_active && <span className="status-badge status-cancelled">Inactive</span>}</h4>
              <div>
                <button className="btn-link" onClick={() => move(i, -1)} disabled={idx === 0}>↑</button>
                <button className="btn-link" onClick={() => move(i, 1)} disabled={idx === items.length - 1}>↓</button>
                <button className="btn-link" onClick={() => startEdit(i)}>Edit</button>
                <button className="btn-link" onClick={() => toggleActive(i)}>{i.is_active ? 'Deactivate' : 'Activate'}</button>
                <button className="btn-link danger" onClick={() => handleDelete(i)}>Delete</button>
              </div>
            </div>
            <p className="muted">{i.why_it_matters}</p>
          </div>
        ))}
        {items.length === 0 && <p>No items yet.</p>}
      </div>
    </div>
  );
}
