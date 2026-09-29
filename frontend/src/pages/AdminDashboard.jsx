import React, { useState } from 'react';
import AdminOverview from '../components/admin/AdminOverview.jsx';
import AdminBookings from '../components/admin/AdminBookings.jsx';
import AdminAdventures from '../components/admin/AdminAdventures.jsx';
import AdminDestinations from '../components/admin/AdminDestinations.jsx';
import AdminGallery from '../components/admin/AdminGallery.jsx';
import AdminAchievements from '../components/admin/AdminAchievements.jsx';
import AdminFaqs from '../components/admin/AdminFaqs.jsx';
import AdminChecklist from '../components/admin/AdminChecklist.jsx';
import AdminRouteComparison from '../components/admin/AdminRouteComparison.jsx';
import AdminParkFees from '../components/admin/AdminParkFees.jsx';
import AdminClients from '../components/admin/AdminClients.jsx';
import AdminMessages from '../components/admin/AdminMessages.jsx';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'adventures', label: 'Adventures & Safaris' },
  { key: 'destinations', label: 'Destinations' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'achievements', label: 'Achievements' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'checklist', label: 'Operator Checklist' },
  { key: 'routeComparison', label: 'Route Comparison' },
  { key: 'parkFees', label: 'Park Fees' },
  { key: 'clients', label: 'Clients' },
  { key: 'messages', label: 'Messages' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="section admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'tab-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {tab === 'overview' && <AdminOverview />}
        {tab === 'bookings' && <AdminBookings />}
        {tab === 'adventures' && <AdminAdventures />}
        {tab === 'destinations' && <AdminDestinations />}
        {tab === 'gallery' && <AdminGallery />}
        {tab === 'achievements' && <AdminAchievements />}
        {tab === 'faqs' && <AdminFaqs />}
        {tab === 'checklist' && <AdminChecklist />}
        {tab === 'routeComparison' && <AdminRouteComparison />}
        {tab === 'parkFees' && <AdminParkFees />}
        {tab === 'clients' && <AdminClients />}
        {tab === 'messages' && <AdminMessages />}
      </div>
    </div>
  );
}
