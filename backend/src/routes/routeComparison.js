const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function parseCard(row) {
  if (!row) return row;
  const parse = (v) => { try { return JSON.parse(v || '[]'); } catch (e) { return []; } };
  const linkedAdventure = row.linked_adventure_id
    ? db.prepare('SELECT id, title, slug, price_adult, price_child FROM adventures WHERE id = ?').get(row.linked_adventure_id)
    : null;
  return { ...row, inclusions: parse(row.inclusions), exclusions: parse(row.exclusions), linkedAdventure };
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM route_comparison_cards WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC').all();
  res.json({ cards: rows.map(parseCard) });
});

router.get('/all', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM route_comparison_cards ORDER BY sort_order ASC, created_at ASC').all();
  res.json({ cards: rows.map(parseCard) });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const b = req.body;
  if (!b.title) return res.status(400).json({ error: 'title is required' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) m FROM route_comparison_cards').get().m;
  const id = uuid();
  db.prepare(`
    INSERT INTO route_comparison_cards (id, title, duration_label, route, difficulty, summit_objective, recommended_experience, price_adult, price_child, availability_note, inclusions, exclusions, linked_adventure_id, whatsapp_message, sort_order)
    VALUES (@id, @title, @duration_label, @route, @difficulty, @summit_objective, @recommended_experience, @price_adult, @price_child, @availability_note, @inclusions, @exclusions, @linked_adventure_id, @whatsapp_message, @sort_order)
  `).run({
    id,
    title: b.title,
    duration_label: b.duration_label || null,
    route: b.route || null,
    difficulty: b.difficulty || null,
    summit_objective: b.summit_objective || null,
    recommended_experience: b.recommended_experience || null,
    price_adult: b.price_adult || null,
    price_child: b.price_child || null,
    availability_note: b.availability_note || null,
    inclusions: JSON.stringify(b.inclusions || []),
    exclusions: JSON.stringify(b.exclusions || []),
    linked_adventure_id: b.linked_adventure_id || null,
    whatsapp_message: b.whatsapp_message || null,
    sort_order: maxOrder + 1,
  });
  res.status(201).json({ card: parseCard(db.prepare('SELECT * FROM route_comparison_cards WHERE id = ?').get(id)) });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM route_comparison_cards WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Card not found' });
  const fields = ['title', 'duration_label', 'route', 'difficulty', 'summit_objective', 'recommended_experience',
    'price_adult', 'price_child', 'availability_note', 'linked_adventure_id', 'whatsapp_message', 'sort_order', 'is_active'];
  const jsonFields = ['inclusions', 'exclusions'];
  const updates = {};
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
  for (const f of jsonFields) if (req.body[f] !== undefined) updates[f] = JSON.stringify(req.body[f]);
  if (updates.is_active !== undefined) updates.is_active = updates.is_active ? 1 : 0;
  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  if (setClause) db.prepare(`UPDATE route_comparison_cards SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });
  res.json({ card: parseCard(db.prepare('SELECT * FROM route_comparison_cards WHERE id = ?').get(req.params.id)) });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM route_comparison_cards WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
