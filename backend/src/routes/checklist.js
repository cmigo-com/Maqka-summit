const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM operator_checklist_items WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC').all();
  res.json({ items: rows });
});

router.get('/all', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM operator_checklist_items ORDER BY sort_order ASC, created_at ASC').all();
  res.json({ items: rows });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { question, why_it_matters } = req.body;
  if (!question || !why_it_matters) return res.status(400).json({ error: 'question and why_it_matters are required' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) m FROM operator_checklist_items').get().m;
  const id = uuid();
  db.prepare('INSERT INTO operator_checklist_items (id, question, why_it_matters, sort_order) VALUES (?, ?, ?, ?)')
    .run(id, question, why_it_matters, maxOrder + 1);
  res.status(201).json({ item: db.prepare('SELECT * FROM operator_checklist_items WHERE id = ?').get(id) });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM operator_checklist_items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Checklist item not found' });
  const fields = ['question', 'why_it_matters', 'sort_order', 'is_active'];
  const updates = {};
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
  if (updates.is_active !== undefined) updates.is_active = updates.is_active ? 1 : 0;
  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE operator_checklist_items SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });
  res.json({ item: db.prepare('SELECT * FROM operator_checklist_items WHERE id = ?').get(req.params.id) });
});

router.put('/reorder/bulk', requireAuth, requireAdmin, (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of item ids' });
  const update = db.prepare('UPDATE operator_checklist_items SET sort_order = ? WHERE id = ?');
  order.forEach((id, index) => update.run(index, id));
  res.json({ success: true });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM operator_checklist_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
