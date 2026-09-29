import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

const STATUS_LABELS = {
  pending: 'Pending Review',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const TABS = [
  { key: 'bookings', label: 'My Bookings' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'profile', label: 'Profile' },
];

function BookingCard({ b }) {
  return (
    <div className="card booking-card">
      <div className="booking-card-header">
        <h3>{b.adventure?.title}</h3>
        <span className={`status-badge status-${b.status}`}>{STATUS_LABELS[b.status] || b.status}</span>
      </div>
      <p className="muted small">Booking #{b.bookingNumber}</p>
      {b.tripDate && <p className="muted">Dates: {b.tripDate.start_date} → {b.tripDate.end_date}</p>}
      <p>Guests: {b.num_adults} adult(s){b.num_children ? `, ${b.num_children} child(ren)` : ''}</p>
      <p>Total: KSh {b.total_price?.toLocaleString()}</p>
      <p>
        Paid: KSh {b.amount_paid?.toLocaleString()} · Outstanding balance:{' '}
        <strong>KSh {b.balance?.toLocaleString()}</strong> ({b.payment_status})
      </p>
      {b.payments?.length > 0 && (
        <details>
          <summary className="muted">Payment history ({b.payments.length})</summary>
          <ul>
            {b.payments.map((p) => (
              <li key={p.id} className="muted small">
                KSh {p.amount.toLocaleString()} via {p.method.replace('_', ' ')} on {p.created_at.slice(0, 10)}
                {p.reference ? ` (ref: ${p.reference})` : ''}
              </li>
            ))}
          </ul>
        </details>
      )}
      {b.notes && <p className="muted">Your notes: {b.notes}</p>}
      {b.admin_notes && <p className="admin-note">Note from our team: {b.admin_notes}</p>}
    </div>
  );
}

function BookingsTab({ token }) {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMyBookings(token).then((data) => setBookings(data.bookings)).catch((e) => setError(e.message));
  }, [token]);

  const upcoming = bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'completed');
  const past = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');

  return (
    <div>
      {error && <p className="error">{error}</p>}
      {bookings.length === 0 && !error && (
        <p>You have no bookings yet. Head to the <a href="/adventures">Adventures</a> page to book your first trek.</p>
      )}
      {upcoming.length > 0 && (
        <>
          <h3>Upcoming Adventures / Pending</h3>
          <div className="bookings-list">{upcoming.map((b) => <BookingCard key={b.id} b={b} />)}</div>
        </>
      )}
      {past.length > 0 && (
        <>
          <h3 style={{ marginTop: 24 }}>Past Bookings</h3>
          <div className="bookings-list">{past.map((b) => <BookingCard key={b.id} b={b} />)}</div>
        </>
      )}
    </div>
  );
}

function NotificationsTab({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  function load() {
    api.getMyNotifications(token).then((data) => setNotifications(data.notifications)).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, [token]);

  async function markRead(n) {
    try { await api.markNotificationRead(n.id, token); load(); } catch (e) { setError(e.message); }
  }

  async function markAllRead() {
    try { await api.markAllNotificationsRead(token); load(); } catch (e) { setError(e.message); }
  }

  return (
    <div>
      {error && <p className="error">{error}</p>}
      {notifications.some((n) => !n.is_read) && (
        <button className="btn-link" onClick={markAllRead}>Mark all as read</button>
      )}
      <div className="notification-list">
        {notifications.map((n) => (
          <div key={n.id} className={`notification-item ${n.is_read ? '' : 'unread'}`}>
            <span>{n.message}</span>
            <span className="muted small">
              {n.created_at.slice(0, 10)}
              {!n.is_read && <button className="btn-link" onClick={() => markRead(n)} style={{ marginLeft: 8 }}>Mark read</button>}
            </span>
          </div>
        ))}
        {notifications.length === 0 && <p>No notifications yet.</p>}
      </div>
    </div>
  );
}

function ProfileTab({ token, user, onUpdated }) {
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const data = await api.updateProfile(form, token);
      onUpdated(data.user);
      setSuccess('Profile updated.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit} className="form">
        <label>Full name <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Phone <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <label>Email <input value={user?.email || ''} disabled /></label>
        <button type="submit" className="btn btn-primary">Save Changes</button>
      </form>
    </div>
  );
}

export default function ClientDashboard() {
  const { user, token, login } = useAuth();
  const [tab, setTab] = useState('bookings');

  function handleProfileUpdated(updatedUser) {
    login(token, { ...user, ...updatedUser });
  }

  return (
    <div className="section">
      <h1>Welcome, {user?.name}</h1>
      <p className="muted">Here are your treks, notifications and account details.</p>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'tab-active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {tab === 'bookings' && <BookingsTab token={token} />}
        {tab === 'notifications' && <NotificationsTab token={token} />}
        {tab === 'profile' && <ProfileTab token={token} user={user} onUpdated={handleProfileUpdated} />}
      </div>
    </div>
  );
}
