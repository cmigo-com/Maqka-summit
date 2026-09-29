const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM park_fee_categories WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC').all();
  res.json({ fees: rows });
});

router.get('/all', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM park_fee_categories ORDER BY sort_order ASC, created_at ASC').all();
  res.json({ fees: rows });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { category_label, adult_fee, child_fee, currency, effective_date, source_url, included_in_package, notes } = req.body;
  if (!category_label) return res.status(400).json({ error: 'category_label is required' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) m FROM park_fee_categories').get().m;
  const id = uuid();
  db.prepare(`
    INSERT INTO park_fee_categories (id, category_label, adult_fee, child_fee, currency, effective_date, source_url, included_in_package, notes, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, category_label, adult_fee || null, child_fee || null, currency || 'KES', effective_date || null, source_url || null, included_in_package ? 1 : 0, notes || null, maxOrder + 1);
  res.status(201).json({ fee: db.prepare('SELECT * FROM park_fee_categories WHERE id = ?').get(id) });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM park_fee_categories WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Fee category not found' });
  const fields = ['category_label', 'adult_fee', 'child_fee', 'currency', 'effective_date', 'source_url', 'included_in_package', 'notes', 'sort_order', 'is_active'];
  const updates = {};
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
  if (updates.included_in_package !== undefined) updates.included_in_package = updates.included_in_package ? 1 : 0;
  if (updates.is_active !== undefined) updates.is_active = updates.is_active ? 1 : 0;
  updates.updated_at = new Date().toISOString();
  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE park_fee_categories SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });
  res.json({ fee: db.prepare('SELECT * FROM park_fee_categories WHERE id = ?').get(req.params.id) });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM park_fee_categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
