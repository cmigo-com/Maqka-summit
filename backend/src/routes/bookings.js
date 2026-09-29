const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../services/email');
const {
  bookingReceivedEmail,
  bookingConfirmedEmail,
  paymentReceivedEmail,
  paymentReminderEmail,
  bookingStatusUpdateEmail,
} = require('../services/emailTemplates');

const router = express.Router();

function recomputePaymentStatus(booking) {
  if (booking.amount_paid <= 0) return 'unpaid';
  if (booking.amount_paid >= booking.total_price) return 'paid';
  return 'partial';
}

function bookingNumber(id) {
  return `ST-${id.slice(0, 8).toUpperCase()}`;
}

function notify(userId, message) {
  db.prepare('INSERT INTO notifications (id, user_id, message) VALUES (?, ?, ?)').run(uuid(), userId, message);
}

function enrichBooking(row) {
  if (!row) return row;
  const adventure = db.prepare('SELECT id, title, slug, route, meeting_point, image_url, duration_days FROM adventures WHERE id = ?').get(row.adventure_id);
  const tripDate = row.trip_date_id
    ? db.prepare('SELECT * FROM trip_dates WHERE id = ?').get(row.trip_date_id)
    : null;
  const client = db.prepare('SELECT id, name, email, phone FROM users WHERE id = ?').get(row.user_id);
  const payments = db.prepare('SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC').all(row.id);
  const balance = Math.max(row.total_price - row.amount_paid, 0);
  return { ...row, bookingNumber: bookingNumber(row.id), adventure, tripDate, client, payments, balance };
}

function travelersLabel(b) {
  return `${b.num_adults} adult(s)${b.num_children ? `, ${b.num_children} child(ren)` : ''}`;
}

function departureLabel(tripDate) {
  return tripDate ? `${tripDate.start_date} to ${tripDate.end_date}` : null;
}

// Customer: create a booking (status starts pending, awaiting admin approval)
router.post('/', requireAuth, (req, res) => {
  const { adventure_id, trip_date_id, num_adults = 1, num_children = 0, notes } = req.body;
  if (!adventure_id) return res.status(400).json({ error: 'adventure_id is required' });

  const adventure = db.prepare('SELECT * FROM adventures WHERE id = ?').get(adventure_id);
  if (!adventure) return res.status(404).json({ error: 'Adventure not found' });

  if (trip_date_id) {
    const trip = db.prepare('SELECT * FROM trip_dates WHERE id = ? AND adventure_id = ?').get(trip_date_id, adventure_id);
    if (!trip) return res.status(404).json({ error: 'Trip date not found for this adventure' });
    if (trip.slots_available < num_adults + num_children) {
      return res.status(400).json({ error: 'Not enough slots available for this trip date' });
    }
    db.prepare('UPDATE trip_dates SET slots_available = slots_available - ? WHERE id = ?')
      .run(num_adults + num_children, trip_date_id);
  }

  const totalPrice = (adventure.price_adult * num_adults) + ((adventure.price_child || 0) * num_children);
  const id = uuid();
  db.prepare(`
    INSERT INTO bookings (id, user_id, adventure_id, trip_date_id, num_adults, num_children, total_price, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, adventure_id, trip_date_id || null, num_adults, num_children, totalPrice, notes || null);

  const booking = enrichBooking(db.prepare('SELECT * FROM bookings WHERE id = ?').get(id));

  notify(req.user.id, `Booking ${booking.bookingNumber} for ${adventure.title} received — pending confirmation.`);
  sendEmail({
    to: booking.client.email,
    ...bookingReceivedEmail({
      name: booking.client.name,
      bookingNumber: booking.bookingNumber,
      adventureTitle: adventure.title,
      departure: departureLabel(booking.tripDate),
      travelers: travelersLabel(booking),
      totalPrice: booking.total_price,
      amountPaid: booking.amount_paid,
      balance: booking.balance,
      status: booking.status,
    }),
  }).catch((e) => console.error('[email] booking received email failed:', e.message));

  res.status(201).json({ booking });
});

// Customer: view own bookings
router.get('/mine', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ bookings: rows.map(enrichBooking) });
});

// View a single booking (owner or admin)
router.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Booking not found' });
  if (row.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to view this booking' });
  }
  res.json({ booking: enrichBooking(row) });
});

// Admin: search/filter all bookings
// Supports: status, payment_status, and a free-text q matching booking id (booking
// number), customer name/email/phone, or adventure title -- plus an exact travel date.
router.get('/', requireAuth, requireAdmin, (req, res) => {
  const { status, payment_status, q, date } = req.query;

  let sql = `
    SELECT b.* FROM bookings b
    JOIN users u ON u.id = b.user_id
    JOIN adventures a ON a.id = b.adventure_id
    LEFT JOIN trip_dates t ON t.id = b.trip_date_id
    WHERE 1 = 1
  `;
  const params = [];

  if (status) { sql += ' AND b.status = ?'; params.push(status); }
  if (payment_status) { sql += ' AND b.payment_status = ?'; params.push(payment_status); }
  if (date) { sql += ' AND (t.start_date <= ? AND t.end_date >= ?)'; params.push(date, date); }
  if (q) {
    sql += ` AND (
      LOWER(b.id) LIKE ? OR LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR
      u.phone LIKE ? OR LOWER(a.title) LIKE ?
    )`;
    const like = `%${q.toLowerCase()}%`;
    params.push(like, like, like, `%${q}%`, like);
  }
  sql += ' ORDER BY b.created_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({ bookings: rows.map(enrichBooking) });
});

// Admin: approve a pending booking
router.put('/:id/approve', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Booking not found' });
  db.prepare("UPDATE bookings SET status = 'confirmed', updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), req.params.id);

  const booking = enrichBooking(db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id));
  notify(booking.user_id, `Your booking ${booking.bookingNumber} for ${booking.adventure.title} has been confirmed.`);
  sendEmail({
    to: booking.client.email,
    ...bookingConfirmedEmail({
      name: booking.client.name,
      bookingNumber: booking.bookingNumber,
      adventureTitle: booking.adventure.title,
      route: booking.adventure.route,
      departure: departureLabel(booking.tripDate),
      travelers: travelersLabel(booking),
      totalPrice: booking.total_price,
      amountPaid: booking.amount_paid,
      balance: booking.balance,
      meetingPoint: booking.adventure.meeting_point,
    }),
  }).catch((e) => console.error('[email] booking confirmed email failed:', e.message));

  res.json({ booking });
});

// Admin: cancel a booking and release its trip-date slots
router.put('/:id/cancel', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Booking not found' });

  if (existing.trip_date_id && existing.status !== 'cancelled') {
    db.prepare('UPDATE trip_dates SET slots_available = slots_available + ? WHERE id = ?')
      .run(existing.num_adults + existing.num_children, existing.trip_date_id);
  }
  db.prepare("UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), req.params.id);

  const booking = enrichBooking(db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id));
  notify(booking.user_id, `Your booking ${booking.bookingNumber} for ${booking.adventure.title} was cancelled.`);
  sendEmail({
    to: booking.client.email,
    ...bookingStatusUpdateEmail({ name: booking.client.name, bookingNumber: booking.bookingNumber, adventureTitle: booking.adventure.title, newStatus: 'Cancelled' }),
  }).catch((e) => console.error('[email] status update email failed:', e.message));

  res.json({ booking });
});

// Admin: mark a booking completed (after the trip happens)
router.put('/:id/complete', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Booking not found' });
  db.prepare("UPDATE bookings SET status = 'completed', updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), req.params.id);

  const booking = enrichBooking(db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id));
  notify(booking.user_id, `Your booking ${booking.bookingNumber} for ${booking.adventure.title} is marked completed. Thanks for trekking with us!`);
  sendEmail({
    to: booking.client.email,
    ...bookingStatusUpdateEmail({ name: booking.client.name, bookingNumber: booking.bookingNumber, adventureTitle: booking.adventure.title, newStatus: 'Completed' }),
  }).catch((e) => console.error('[email] status update email failed:', e.message));

  res.json({ booking });
});

// Admin: send a payment reminder email for a booking with an outstanding balance
router.post('/:id/remind', requireAuth, requireAdmin, (req, res) => {
  const booking = enrichBooking(db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id));
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.balance <= 0) return res.status(400).json({ error: 'This booking has no outstanding balance' });

  sendEmail({
    to: booking.client.email,
    ...paymentReminderEmail({
      name: booking.client.name,
      bookingNumber: booking.bookingNumber,
      adventureTitle: booking.adventure.title,
      balance: booking.balance,
      departure: departureLabel(booking.tripDate),
    }),
  }).catch((e) => console.error('[email] payment reminder email failed:', e.message));

  res.json({ success: true });
});

// Admin: general update (admin_notes, num_adults/children, trip_date_id, status)
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Booking not found' });

  const fields = ['admin_notes', 'num_adults', 'num_children', 'trip_date_id', 'status'];
  const updates = {};
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
  updates.updated_at = new Date().toISOString();

  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE bookings SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });

  const booking = enrichBooking(db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id));

  if (updates.status && updates.status !== existing.status) {
    notify(booking.user_id, `Your booking ${booking.bookingNumber} for ${booking.adventure.title} status changed to ${updates.status}.`);
    sendEmail({
      to: booking.client.email,
      ...bookingStatusUpdateEmail({ name: booking.client.name, bookingNumber: booking.bookingNumber, adventureTitle: booking.adventure.title, newStatus: updates.status }),
    }).catch((e) => console.error('[email] status update email failed:', e.message));
  }

  res.json({ booking });
});

// Admin: record a real payment against a booking (bank transfer/cash confirmed on receipt)
// This is the ONLY way amount_paid changes -- it is never set directly, so every shilling
// of "paid" status is backed by an auditable payments row recorded by an admin.
router.post('/:id/payments', requireAuth, requireAdmin, (req, res) => {
  const { amount, method = 'bank_transfer', reference } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'A positive amount is required' });

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const paymentId = uuid();
  const paymentCreatedAt = new Date().toISOString();
  db.prepare('INSERT INTO payments (id, booking_id, amount, method, reference, recorded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(paymentId, booking.id, amount, method, reference || null, req.user.id, paymentCreatedAt);

  const newAmountPaid = booking.amount_paid + Number(amount);
  const newPaymentStatus = recomputePaymentStatus({ ...booking, amount_paid: newAmountPaid });
  db.prepare('UPDATE bookings SET amount_paid = ?, payment_status = ?, updated_at = ? WHERE id = ?')
    .run(newAmountPaid, newPaymentStatus, new Date().toISOString(), booking.id);

  const updated = enrichBooking(db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id));
  notify(updated.user_id, `Payment of KSh ${Number(amount).toLocaleString()} recorded for booking ${updated.bookingNumber}.`);
  sendEmail({
    to: updated.client.email,
    ...paymentReceivedEmail({
      name: updated.client.name,
      bookingNumber: updated.bookingNumber,
      amount,
      reference,
      totalPaid: updated.amount_paid,
      balance: updated.balance,
      paymentDate: paymentCreatedAt.slice(0, 10),
    }),
  }).catch((e) => console.error('[email] payment received email failed:', e.message));

  res.status(201).json({ booking: updated });
});

module.exports = router;
