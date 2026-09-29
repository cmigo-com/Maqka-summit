const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function parseJsonFields(row) {
  if (!row) return row;
  const parse = (v) => { try { return JSON.parse(v || '[]'); } catch (e) { return []; } };
  return {
    ...row,
    highlights: parse(row.highlights),
    inclusions: parse(row.inclusions),
    exclusions: parse(row.exclusions),
    itinerary: parse(row.itinerary),
  };
}

function withMountain(row) {
  if (!row) return row;
  const mountain = row.mountain_id
    ? db.prepare('SELECT id, name, slug, region FROM mountains WHERE id = ?').get(row.mountain_id)
    : null;
  return { ...row, mountain };
}

// Public: list active adventures, with optional filters
router.get('/', (req, res) => {
  const { difficulty, mountain, q, duration_min, duration_max, price_min, price_max, departure_date, category, county, featured, type } = req.query;
  let sql = 'SELECT * FROM adventures WHERE is_active = 1';
  const params = [];
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (difficulty) { sql += ' AND difficulty = ?'; params.push(difficulty); }
  if (mountain) { sql += ' AND mountain_id = (SELECT id FROM mountains WHERE slug = ?)'; params.push(mountain); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (county) { sql += ' AND county = ?'; params.push(county); }
  if (featured === 'true' || featured === '1') { sql += ' AND is_featured = 1'; }
  if (q) { sql += ' AND (title LIKE ? OR location LIKE ? OR route LIKE ? OR county LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`); }
  if (duration_min) { sql += ' AND duration_days >= ?'; params.push(Number(duration_min)); }
  if (duration_max) { sql += ' AND duration_days <= ?'; params.push(Number(duration_max)); }
  if (price_min) { sql += ' AND price_adult >= ?'; params.push(Number(price_min)); }
  if (price_max) { sql += ' AND price_adult <= ?'; params.push(Number(price_max)); }
  if (departure_date) {
    sql += ' AND id IN (SELECT adventure_id FROM trip_dates WHERE start_date <= ? AND end_date >= ?)';
    params.push(departure_date, departure_date);
  }
  sql += ' ORDER BY is_featured DESC, created_at DESC';

  const rows = db.prepare(sql).all(...params);
  const tripDateStmt = db.prepare("SELECT * FROM trip_dates WHERE adventure_id = ? AND start_date >= date('now') ORDER BY start_date ASC");
  const result = rows.map((r) => ({ ...withMountain(parseJsonFields(r)), tripDates: tripDateStmt.all(r.id) }));
  res.json({ adventures: result });
});

// Public: distinct category/county values, for populating filter dropdowns
router.get('/meta/filters', (req, res) => {
  const categories = db.prepare("SELECT DISTINCT category FROM adventures WHERE is_active = 1 AND category IS NOT NULL ORDER BY category").all().map((r) => r.category);
  const counties = db.prepare("SELECT DISTINCT county FROM adventures WHERE is_active = 1 AND county IS NOT NULL ORDER BY county").all().map((r) => r.county);
  res.json({ categories, counties });
});

router.get('/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM adventures WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Adventure not found' });
  const tripDates = db.prepare("SELECT * FROM trip_dates WHERE adventure_id = ? AND start_date >= date('now') ORDER BY start_date ASC").all(row.id);
  const reviews = db.prepare('SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.adventure_id = ? AND r.is_approved = 1 ORDER BY r.created_at DESC').all(row.id);
  res.json({ adventure: { ...withMountain(parseJsonFields(row)), tripDates, reviews } });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const b = req.body;
  if (!b.title || !b.slug || !b.price_adult) {
    return res.status(400).json({ error: 'title, slug and price_adult are required' });
  }
  const id = uuid();
  db.prepare(`
    INSERT INTO adventures (id, mountain_id, type, title, slug, category, county, route, location, duration_days, difficulty, max_altitude_m, price_adult, price_child, max_guests, description, highlights, inclusions, exclusions, itinerary, accommodation, meals, transport, meeting_point, image_url, is_featured)
    VALUES (@id, @mountain_id, @type, @title, @slug, @category, @county, @route, @location, @duration_days, @difficulty, @max_altitude_m, @price_adult, @price_child, @max_guests, @description, @highlights, @inclusions, @exclusions, @itinerary, @accommodation, @meals, @transport, @meeting_point, @image_url, @is_featured)
  `).run({
    id,
    mountain_id: b.mountain_id || null,
    type: b.type || 'trek',
    title: b.title,
    slug: b.slug,
    category: b.category || null,
    county: b.county || null,
    route: b.route || null,
    location: b.location || null,
    duration_days: b.duration_days || null,
    difficulty: b.difficulty || null,
    max_altitude_m: b.max_altitude_m || null,
    price_adult: b.price_adult,
    price_child: b.price_child || null,
    max_guests: b.max_guests || 20,
    description: b.description || null,
    highlights: JSON.stringify(b.highlights || []),
    inclusions: JSON.stringify(b.inclusions || []),
    exclusions: JSON.stringify(b.exclusions || []),
    itinerary: JSON.stringify(b.itinerary || []),
    accommodation: b.accommodation || null,
    meals: b.meals || null,
    transport: b.transport || null,
    meeting_point: b.meeting_point || null,
    image_url: b.image_url || null,
    is_featured: b.is_featured ? 1 : 0,
  });
  const row = db.prepare('SELECT * FROM adventures WHERE id = ?').get(id);
  res.status(201).json({ adventure: withMountain(parseJsonFields(row)) });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM adventures WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Adventure not found' });

  const fields = ['mountain_id', 'type', 'title', 'slug', 'category', 'county', 'route', 'location', 'duration_days', 'difficulty',
    'max_altitude_m', 'price_adult', 'price_child', 'max_guests', 'description', 'accommodation', 'meals', 'transport', 'meeting_point', 'image_url', 'is_active', 'is_featured'];
  const jsonFields = ['highlights', 'inclusions', 'exclusions', 'itinerary'];

  const updates = {};
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
  if (updates.is_featured !== undefined) updates.is_featured = updates.is_featured ? 1 : 0;
  for (const f of jsonFields) if (req.body[f] !== undefined) updates[f] = JSON.stringify(req.body[f]);

  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  if (setClause) db.prepare(`UPDATE adventures SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });

  const row = db.prepare('SELECT * FROM adventures WHERE id = ?').get(req.params.id);
  res.json({ adventure: withMountain(parseJsonFields(row)) });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM adventures WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Adventure not found' });
  db.prepare('UPDATE adventures SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/trip-dates', requireAuth, requireAdmin, (req, res) => {
  const { start_date, end_date, slots_available } = req.body;
  if (!start_date || !end_date || !slots_available) {
    return res.status(400).json({ error: 'start_date, end_date and slots_available are required' });
  }
  const adventure = db.prepare('SELECT id FROM adventures WHERE id = ?').get(req.params.id);
  if (!adventure) return res.status(404).json({ error: 'Adventure not found' });
  const id = uuid();
  db.prepare('INSERT INTO trip_dates (id, adventure_id, start_date, end_date, slots_available) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.id, start_date, end_date, slots_available);
  res.status(201).json({ tripDate: db.prepare('SELECT * FROM trip_dates WHERE id = ?').get(id) });
});

router.delete('/:id/trip-dates/:tripDateId', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM trip_dates WHERE id = ? AND adventure_id = ?').get(req.params.tripDateId, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Trip date not found' });
  db.prepare('DELETE FROM trip_dates WHERE id = ?').run(req.params.tripDateId);
  res.json({ success: true });
});

module.exports = router;
