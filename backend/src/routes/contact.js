const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../services/email');
const { contactReplyEmail } = require('../services/emailTemplates');

const router = express.Router();

function withReplies(row) {
  if (!row) return row;
  const replies = db.prepare('SELECT r.*, u.name as admin_name FROM message_replies r LEFT JOIN users u ON u.id = r.admin_id WHERE r.message_id = ? ORDER BY r.created_at ASC').all(row.id);
  const adventure = row.adventure_id ? db.prepare('SELECT id, title, slug FROM adventures WHERE id = ?').get(row.adventure_id) : null;
  return { ...row, replies, adventure };
}

// Public: anyone can send a message, no account required
router.post('/', (req, res) => {
  const { name, email, phone, subject, message, adventure_id } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email and message are required' });
  }
  const id = uuid();
  db.prepare('INSERT INTO contact_messages (id, name, email, phone, subject, message, adventure_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, email, phone || null, subject || null, message, adventure_id || null);

  res.status(201).json({
    success: true,
    messageId: id,
    message: 'Thank you for contacting Maqka Summit. We have received your message and will get back to you shortly.',
  });
});

// Admin: list messages, with search + status/read filters
router.get('/', requireAuth, requireAdmin, (req, res) => {
  const { q, status, is_read } = req.query;
  let sql = 'SELECT * FROM contact_messages WHERE 1 = 1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (is_read === 'true' || is_read === '1') { sql += ' AND is_read = 1'; }
  if (is_read === 'false' || is_read === '0') { sql += ' AND is_read = 0'; }
  if (q) {
    sql += ' AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ? OR LOWER(message) LIKE ?)';
    const like = `%${q.toLowerCase()}%`;
    params.push(like, like, `%${q}%`, like);
  }
  sql += ' ORDER BY created_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({ messages: rows.map(withReplies) });
});

// Admin: open a single conversation (also marks it read)
router.get('/:id', requireAuth, requireAdmin, (req, res) => {
  const row = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Message not found' });
  if (!row.is_read) db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(row.id);
  res.json({ message: withReplies(db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(row.id)) });
});

router.put('/:id/read', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Message not found' });
  db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.put('/:id/unread', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Message not found' });
  db.prepare('UPDATE contact_messages SET is_read = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.put('/:id/status', requireAuth, requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['open', 'resolved'].includes(status)) return res.status(400).json({ error: 'status must be open or resolved' });
  const existing = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Message not found' });
  db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Admin: reply to a visitor -- stores the reply AND emails the visitor directly,
// without needing them to have an account. Never exposes the admin's own email/credentials;
// the reply is sent from the shared Maqka Summit support address.
router.post('/:id/reply', requireAuth, requireAdmin, async (req, res) => {
  const { reply_text } = req.body;
  if (!reply_text || !reply_text.trim()) return res.status(400).json({ error: 'reply_text is required' });

  const original = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(req.params.id);
  if (!original) return res.status(404).json({ error: 'Message not found' });

  const replyId = uuid();
  const result = await sendEmail({
    to: original.email,
    ...contactReplyEmail({ name: original.name, replyText: reply_text }),
  }).catch((e) => { console.error('[email] contact reply email failed:', e.message); return { sent: false }; });

  db.prepare('INSERT INTO message_replies (id, message_id, admin_id, reply_text, email_sent) VALUES (?, ?, ?, ?, ?)')
    .run(replyId, original.id, req.user.id, reply_text, result?.sent ? 1 : 0);

  db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(original.id);

  res.status(201).json({ message: withReplies(db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(original.id)) });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
