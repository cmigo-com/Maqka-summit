import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api.js';

const EMPTY_FORM = { category_label: '', adult_fee: '', child_fee: '', currency: 'KES', effective_date: '', source_url: '', included_in_package: false, notes: '' };

export default function AdminParkFees() {
  const { token } = useAuth();
  const [fees, setFees] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api.getAllParkFees(token).then((d) => setFees(d.fees)).catch((e) => setError(e.message));
  }
  useEffect(() => { load(); }, [token]);

  function startEdit(f) {
    setEditingId(f.id);
    setForm({
      category_label: f.category_label, adult_fee: f.adult_fee || '', child_fee: f.child_fee || '',
      currency: f.currency || 'KES', effective_date: f.effective_date || '', source_url: f.source_url || '',
      included_in_package: !!f.included_in_package, notes: f.notes || '',
    });
  }
  function resetForm() { setEditingId(null); setForm(EMPTY_FORM); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      adult_fee: form.adult_fee ? Number(form.adult_fee) : null,
      child_fee: form.child_fee ? Number(form.child_fee) : null,
    };
    try {
      if (editingId) await api.updateParkFee(editingId, payload, token);
      else await api.createParkFee(payload, token);
      resetForm(); load();
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(f) {
    if (!confirm(`Delete "${f.category_label}"?`)) return;
    try { await api.deleteParkFee(f.id, token); load(); } catch (e) { setError(e.message); }
  }

  return (
    <div>
      <p className="muted">
        Every fee needs an effective date and official source before it's trustworthy —
        park fees change, and these are shown to customers on the Mount Kenya page.
      </p>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <h3>{editingId ? 'Edit Fee Category' : 'Add Fee Category'}</h3>
        <form onSubmit={handleSubmit} className="form form-grid">
          <label>Category label <input required value={form.category_label} onChange={(e) => setForm({ ...form, category_label: e.target.value })} placeholder="e.g. Non-Resident" /></label>
          <label>Adult fee <input type="number" value={form.adult_fee} onChange={(e) => setForm({ ...form, adult_fee: e.target.value })} /></label>
          <label>Child/Student fee <input type="number" value={form.child_fee} onChange={(e) => setForm({ ...form, child_fee: e.target.value })} /></label>
          <label>Currency <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></label>
          <label>Effective date <input type="date" value={form.effective_date} onChange={(e) => setForm({ ...form, effective_date: e.target.value })} /></label>
          <label>Official source URL <input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} placeholder="https://www.kws.go.ke/..." /></label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.included_in_package} onChange={(e) => setForm({ ...form, included_in_package: e.target.checked })} />
            Included in package price
          </label>
          <label className="full-width">Notes <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <div className="form-actions full-width">
            <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>
      <h3>All Fee Categories</h3>
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Category</th><th>Adult</th><th>Child</th><th>Effective</th><th>Source</th><th>Included?</th><th></th></tr></thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f.id}>
                <td>{f.category_label}</td>
                <td>{f.adult_fee ? `${f.currency} ${f.adult_fee.toLocaleString()}` : 'Not set'}</td>
                <td>{f.child_fee ? `${f.currency} ${f.child_fee.toLocaleString()}` : 'Not set'}</td>
                <td>{f.effective_date || '—'}</td>
                <td>{f.source_url ? <a href={f.source_url} target="_blank" rel="noopener noreferrer">Link</a> : '—'}</td>
                <td>{f.included_in_package ? 'Yes' : 'No'}</td>
                <td>
                  <button className="btn-link" onClick={() => startEdit(f)}>Edit</button>
                  <button className="btn-link danger" onClick={() => handleDelete(f)}>Delete</button>
                </td>
              </tr>
            ))}
            {fees.length === 0 && <tr><td colSpan={7}>No fee categories yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
