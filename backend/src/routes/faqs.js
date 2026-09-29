const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { topic } = req.query;
  const rows = topic
    ? db.prepare('SELECT * FROM faqs WHERE is_active = 1 AND topic = ? ORDER BY sort_order ASC, created_at ASC').all(topic)
    : db.prepare('SELECT * FROM faqs WHERE is_active = 1 ORDER BY topic ASC, sort_order ASC, created_at ASC').all();
  res.json({ faqs: rows });
});

router.get('/topics', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT topic FROM faqs ORDER BY topic ASC').all();
  res.json({ topics: rows.map((r) => r.topic) });
});

// Admin: list all (including inactive) for management
router.get('/all', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM faqs ORDER BY topic ASC, sort_order ASC, created_at ASC').all();
  res.json({ faqs: rows });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { question, answer, topic } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'question and answer are required' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) m FROM faqs').get().m;
  const id = uuid();
  db.prepare('INSERT INTO faqs (id, question, answer, topic, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(id, question, answer, topic || 'General', maxOrder + 1);
  res.status(201).json({ faq: db.prepare('SELECT * FROM faqs WHERE id = ?').get(id) });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM faqs WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'FAQ not found' });
  const fields = ['question', 'answer', 'topic', 'sort_order', 'is_active'];
  const updates = {};
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
  if (updates.is_active !== undefined) updates.is_active = updates.is_active ? 1 : 0;
  updates.updated_at = new Date().toISOString();
  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE faqs SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });
  res.json({ faq: db.prepare('SELECT * FROM faqs WHERE id = ?').get(req.params.id) });
});

router.put('/reorder/bulk', requireAuth, requireAdmin, (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of faq ids' });
  const update = db.prepare('UPDATE faqs SET sort_order = ? WHERE id = ?');
  order.forEach((id, index) => update.run(index, id));
  res.json({ success: true });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM faqs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
