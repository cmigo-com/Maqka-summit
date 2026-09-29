const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', (req, res) => {
  const totalBookings = db.prepare('SELECT COUNT(*) c FROM bookings').get().c;
  const pending = db.prepare("SELECT COUNT(*) c FROM bookings WHERE status = 'pending'").get().c;
  const confirmed = db.prepare("SELECT COUNT(*) c FROM bookings WHERE status = 'confirmed'").get().c;
  const cancelled = db.prepare("SELECT COUNT(*) c FROM bookings WHERE status = 'cancelled'").get().c;
  const totalPaid = db.prepare('SELECT COALESCE(SUM(amount), 0) s FROM payments').get().s;
  const outstanding = db.prepare("SELECT COALESCE(SUM(total_price - amount_paid), 0) s FROM bookings WHERE status != 'cancelled'").get().s;
  const totalClients = db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'customer'").get().c;
  const totalAdventures = db.prepare('SELECT COUNT(*) c FROM adventures WHERE is_active = 1').get().c;
  const upcomingTripDates = db.prepare("SELECT COUNT(*) c FROM trip_dates WHERE start_date >= date('now')").get().c;
  const unreadMessages = db.prepare('SELECT COUNT(*) c FROM contact_messages WHERE is_read = 0').get().c;

  res.json({
    totalBookings, pending, confirmed, cancelled, totalPaid, outstanding,
    totalClients, totalAdventures, upcomingTripDates, unreadMessages,
  });
});

router.get('/clients', (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.created_at,
      (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id) as booking_count
    FROM users u WHERE u.role = 'customer' ORDER BY u.created_at DESC
  `).all();
  res.json({ clients: rows });
});

router.get('/clients/:id', (req, res) => {
  const client = db.prepare("SELECT id, name, email, phone, created_at FROM users WHERE id = ? AND role = 'customer'").get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  const bookings = db.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ client, bookings });
});

module.exports = router;
