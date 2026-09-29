import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api.js';

export default function AdminClients() {
  const { token } = useAuth();
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getClients(token).then((data) => setClients(data.clients)).catch((e) => setError(e.message));
  }, [token]);

  return (
    <div>
      <p className="muted">Everyone who has signed up as a customer.</p>
      {error && <p className="error">{error}</p>}
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Bookings</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone || '—'}</td>
                <td>{c.booking_count}</td>
                <td>{c.created_at}</td>
              </tr>
            ))}
            {clients.length === 0 && <tr><td colSpan={5}>No clients have signed up yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
