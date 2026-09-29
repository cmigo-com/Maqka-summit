const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM achievements WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC').all();
  res.json({ achievements: rows });
});

router.get('/all', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM achievements ORDER BY sort_order ASC, created_at DESC').all();
  res.json({ achievements: rows });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { title, category, year, description, image_url } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) m FROM achievements').get().m;
  const id = uuid();
  db.prepare('INSERT INTO achievements (id, title, category, year, description, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, title, category || null, year || null, description || null, image_url || null, maxOrder + 1);
  res.status(201).json({ achievement: db.prepare('SELECT * FROM achievements WHERE id = ?').get(id) });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM achievements WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Achievement not found' });
  const fields = ['title', 'category', 'year', 'description', 'image_url', 'sort_order', 'is_active'];
  const updates = {};
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
  if (updates.is_active !== undefined) updates.is_active = updates.is_active ? 1 : 0;
  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE achievements SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });
  res.json({ achievement: db.prepare('SELECT * FROM achievements WHERE id = ?').get(req.params.id) });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM achievements WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
