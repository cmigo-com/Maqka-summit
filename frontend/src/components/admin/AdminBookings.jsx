import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api.js';

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'];
const PAYMENT_STATUS_OPTIONS = ['unpaid', 'partial', 'paid'];
const EMPTY_SEARCH = { q: '', status: '', payment_status: '', date: '' };

export default function AdminBookings() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState(EMPTY_SEARCH);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({});

  function load(activeSearch) {
    api.getAllBookings(token, activeSearch).then((data) => setBookings(data.bookings)).catch((e) => setError(e.message));
  }

  useEffect(() => { load(search); }, [token]);

  function updateSearch(field, value) {
    setSearch((s) => ({ ...s, [field]: value }));
  }

  function handleSearch(e) {
    e.preventDefault();
    load(search);
  }

  function handleResetSearch() {
    setSearch(EMPTY_SEARCH);
    load(EMPTY_SEARCH);
  }

  async function handleApprove(b) {
    setBusyId(b.id); setError('');
    try { await api.approveBooking(b.id, token); load(search); }
    catch (e) { setError(e.message); } finally { setBusyId(null); }
  }

  async function handleCancel(b) {
    if (!confirm(`Cancel booking for ${b.client?.name}? This releases the reserved slots.`)) return;
    setBusyId(b.id); setError('');
    try { await api.cancelBooking(b.id, token); load(search); }
    catch (e) { setError(e.message); } finally { setBusyId(null); }
  }

  async function handleComplete(b) {
    setBusyId(b.id); setError('');
    try { await api.completeBooking(b.id, token); load(search); }
    catch (e) { setError(e.message); } finally { setBusyId(null); }
  }

  async function handleRemind(b) {
    setBusyId(b.id); setError('');
    try { await api.sendPaymentReminder(b.id, token); alert('Payment reminder email sent (or logged, if email isn\u2019t configured yet).'); }
    catch (e) { setError(e.message); } finally { setBusyId(null); }
  }

  async function saveAdminNote(b, note) {
    try { await api.updateBooking(b.id, { admin_notes: note }, token); }
    catch (e) { setError(e.message); }
  }

  async function handleRecordPayment(b) {
    const p = paymentForm[b.id];
    if (!p?.amount || Number(p.amount) <= 0) {
      setError('Enter a valid payment amount before recording it.');
      return;
    }
    setBusyId(b.id); setError('');
    try {
      await api.recordPayment(b.id, {
        amount: Number(p.amount),
        method: p.method || 'bank_transfer',
        reference: p.reference || undefined,
      }, token);
      setPaymentForm((f) => ({ ...f, [b.id]: {} }));
      load(search);
    } catch (e) { setError(e.message); } finally { setBusyId(null); }
  }

  return (
    <div>
      <form className="search-panel" onSubmit={handleSearch}>
        <input
          type="text"
          className="search-input"
          placeholder="Search by booking number, customer name, email, phone or adventure..."
          value={search.q}
          onChange={(e) => updateSearch('q', e.target.value)}
        />
        <div className="filter-grid">
          <label>
            Status
            <select value={search.status} onChange={(e) => updateSearch('status', e.target.value)}>
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            Payment Status
            <select value={search.payment_status} onChange={(e) => updateSearch('payment_status', e.target.value)}>
              <option value="">All</option>
              {PAYMENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            Travel Date
            <input type="date" value={search.date} onChange={(e) => updateSearch('date', e.target.value)} />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={handleResetSearch}>Reset</button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="admin-trek-list">
        {bookings.map((b) => (
          <div className={`card ${busyId === b.id ? 'row-saving' : ''}`} key={b.id}>
            <div className="booking-card-header">
              <div>
                <h4>#{b.bookingNumber} — {b.client?.name} — {b.adventure?.title}</h4>
                <p className="muted small">{b.client?.email} · {b.client?.phone}</p>
              </div>
              <span className={`status-badge status-${b.status}`}>{b.status}</span>
            </div>

            <p className="muted">
              {b.tripDate ? `${b.tripDate.start_date} → ${b.tripDate.end_date}` : 'No fixed date'} ·{' '}
              {b.num_adults} adult(s){b.num_children ? `, ${b.num_children} child(ren)` : ''}
            </p>
            <p>
              Total: KSh {b.total_price?.toLocaleString()} · Paid: KSh {b.amount_paid?.toLocaleString()} ·{' '}
              Balance: <strong>KSh {b.balance?.toLocaleString()}</strong> ({b.payment_status})
            </p>
            {b.notes && <p className="muted">Client notes: {b.notes}</p>}

            <div className="form-row small-form" style={{ margin: '10px 0', flexWrap: 'wrap' }}>
              {b.status === 'pending' && (
                <button className="btn btn-sm btn-primary" onClick={() => handleApprove(b)} disabled={busyId === b.id}>
                  Approve Booking
                </button>
              )}
              {b.status === 'confirmed' && (
                <button className="btn btn-sm btn-outline" onClick={() => handleComplete(b)} disabled={busyId === b.id}>
                  Mark Completed
                </button>
              )}
              {b.balance > 0 && b.status !== 'cancelled' && (
                <button className="btn btn-sm btn-outline" onClick={() => handleRemind(b)} disabled={busyId === b.id}>
                  Send Payment Reminder
                </button>
              )}
              {b.status !== 'cancelled' && (
                <button className="btn-link danger" onClick={() => handleCancel(b)} disabled={busyId === b.id}>
                  Cancel Booking
                </button>
              )}
            </div>

            <div className="form-row small-form">
              <input
                type="number"
                placeholder="Amount (KSh)"
                min="1"
                value={paymentForm[b.id]?.amount || ''}
                onChange={(e) => setPaymentForm((f) => ({ ...f, [b.id]: { ...f[b.id], amount: e.target.value } }))}
              />
              <select
                value={paymentForm[b.id]?.method || 'bank_transfer'}
                onChange={(e) => setPaymentForm((f) => ({ ...f, [b.id]: { ...f[b.id], method: e.target.value } }))}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
              <input
                type="text"
                placeholder="Reference (optional)"
                value={paymentForm[b.id]?.reference || ''}
                onChange={(e) => setPaymentForm((f) => ({ ...f, [b.id]: { ...f[b.id], reference: e.target.value } }))}
              />
              <button className="btn btn-sm btn-outline" onClick={() => handleRecordPayment(b)} disabled={busyId === b.id}>
                Record Payment
              </button>
            </div>

            <input
              defaultValue={b.admin_notes || ''}
              placeholder="Add a note visible to the client..."
              style={{ width: '100%', marginTop: 10 }}
              onBlur={(e) => saveAdminNote(b, e.target.value)}
            />
          </div>
        ))}
        {bookings.length === 0 && <p>No bookings match your search.</p>}
      </div>
    </div>
  );
}
