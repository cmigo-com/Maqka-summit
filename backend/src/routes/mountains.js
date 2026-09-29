const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function parseHighlights(row) {
  if (!row) return row;
  let highlights = [];
  try { highlights = JSON.parse(row.highlights || '[]'); } catch (e) { highlights = []; }
  return { ...row, highlights };
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM mountains ORDER BY name ASC').all();
  res.json({ mountains: rows.map(parseHighlights) });
});

// Public: a destination's detail, including its active adventures -- powers the
// "Our Destinations" page's "View Destination" button
router.get('/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM mountains WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Mountain not found' });
  const adventures = db.prepare('SELECT id, title, slug, price_adult, price_child, duration_days, difficulty, image_url, type FROM adventures WHERE mountain_id = ? AND is_active = 1').all(row.id);
  res.json({ mountain: { ...parseHighlights(row), adventures } });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { name, slug, region, description, image_url, highlights } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' });
  const id = uuid();
  db.prepare(
    'INSERT INTO mountains (id, name, slug, region, description, highlights, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, slug, region || null, description || null, JSON.stringify(highlights || []), image_url || null);
  res.status(201).json({ mountain: parseHighlights(db.prepare('SELECT * FROM mountains WHERE id = ?').get(id)) });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM mountains WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Mountain not found' });
  const fields = ['name', 'slug', 'region', 'description', 'image_url'];
  const updates = {};
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
  if (req.body.highlights !== undefined) updates.highlights = JSON.stringify(req.body.highlights);
  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  if (setClause) db.prepare(`UPDATE mountains SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });
  res.json({ mountain: parseHighlights(db.prepare('SELECT * FROM mountains WHERE id = ?').get(req.params.id)) });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM mountains WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Mountain not found' });
  db.prepare('DELETE FROM mountains WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
