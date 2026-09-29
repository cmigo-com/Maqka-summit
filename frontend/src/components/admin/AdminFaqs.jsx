import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api.js';

export default function AdminFaqs() {
  const { token } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState({ question: '', answer: '', topic: 'General' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api.getAllFaqs(token).then((data) => setFaqs(data.faqs)).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, [token]);

  function startEdit(f) {
    setEditingId(f.id);
    setForm({ question: f.question, answer: f.answer, topic: f.topic || 'General' });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ question: '', answer: '', topic: 'General' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await api.updateFaq(editingId, form, token);
      else await api.createFaq(form, token);
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive(f) {
    try { await api.updateFaq(f.id, { is_active: !f.is_active }, token); load(); } catch (e) { setError(e.message); }
  }

  async function handleDelete(f) {
    if (!confirm('Delete this FAQ?')) return;
    try { await api.deleteFaq(f.id, token); load(); } catch (e) { setError(e.message); }
  }

  async function move(f, direction) {
    const index = faqs.findIndex((x) => x.id === f.id);
    const swapWith = faqs[index + direction];
    if (!swapWith) return;
    const order = faqs.map((x) => x.id);
    [order[index], order[index + direction]] = [order[index + direction], order[index]];
    try { await api.reorderFaqs(order, token); load(); } catch (e) { setError(e.message); }
  }

  return (
    <div>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>{editingId ? 'Edit FAQ' : 'Add New FAQ'}</h3>
        <form onSubmit={handleSubmit} className="form">
          <label>Question <input required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></label>
          <label>
            Topic
            <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="General or Mount Kenya" />
          </label>
          <label>Answer <textarea required rows={3} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Add FAQ'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <h3>All FAQs</h3>
      <div className="admin-trek-list">
        {faqs.map((f, i) => (
          <div className="card" key={f.id}>
            <div className="booking-card-header">
              <h4>{f.question} <span className="status-badge status-confirmed">{f.topic || 'General'}</span> {!f.is_active && <span className="status-badge status-cancelled">Inactive</span>}</h4>
              <div>
                <button className="btn-link" onClick={() => move(f, -1)} disabled={i === 0}>↑</button>
                <button className="btn-link" onClick={() => move(f, 1)} disabled={i === faqs.length - 1}>↓</button>
                <button className="btn-link" onClick={() => startEdit(f)}>Edit</button>
                <button className="btn-link" onClick={() => toggleActive(f)}>{f.is_active ? 'Deactivate' : 'Activate'}</button>
                <button className="btn-link danger" onClick={() => handleDelete(f)}>Delete</button>
              </div>
            </div>
            <p className="muted">{f.answer}</p>
          </div>
        ))}
        {faqs.length === 0 && <p>No FAQs yet.</p>}
      </div>
    </div>
  );
}
