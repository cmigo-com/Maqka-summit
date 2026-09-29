import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api.js';

export default function AdminOverview() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAdminStats(token).then(setStats).catch((e) => setError(e.message));
  }, [token]);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p>Loading stats...</p>;

  const cards = [
    { label: 'Total Bookings', value: stats.totalBookings },
    { label: 'Pending Approval', value: stats.pending },
    { label: 'Confirmed', value: stats.confirmed },
    { label: 'Cancelled', value: stats.cancelled },
    { label: 'Total Paid (KSh)', value: stats.totalPaid.toLocaleString() },
    { label: 'Outstanding Balance (KSh)', value: stats.outstanding.toLocaleString() },
    { label: 'Total Clients', value: stats.totalClients },
    { label: 'Active Adventures', value: stats.totalAdventures },
    { label: 'Upcoming Trip Dates', value: stats.upcomingTripDates },
    { label: 'Unread Messages', value: stats.unreadMessages },
  ];

  return (
    <div className="grid-3">
      {cards.map((c) => (
        <div className="card stat-card" key={c.label}>
          <p className="stat-value">{c.value}</p>
          <p className="stat-label">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
