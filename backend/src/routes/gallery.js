const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const GALLERY_CATEGORIES = [
  'Mount Kenya', 'Mount Longonot', 'Ngong Hills', 'Karura Forest', "Hell's Gate",
  'Mt Kilimambogo', 'Aberdare', 'Menengai', 'Waterfalls', 'Forest Trails',
  'Hiking Adventures', 'Team & Guides', 'Maqka Summit Experiences',
];

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'gallery');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 20 }, // 8MB per photo, up to 20 at once
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error('Only JPG, PNG and WEBP photos are allowed'));
    cb(null, true);
  },
});

function withAdventure(row) {
  if (!row) return row;
  const adventure = row.adventure_id
    ? db.prepare('SELECT id, title, slug FROM adventures WHERE id = ?').get(row.adventure_id)
    : null;
  return { ...row, adventure };
}

// Public: list gallery photos (optionally filtered by category or featured-only)
router.get('/', (req, res) => {
  const { category, featured, adventure_id } = req.query;
  let sql = 'SELECT * FROM gallery_images WHERE is_active = 1';
  const params = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (adventure_id) { sql += ' AND adventure_id = ?'; params.push(adventure_id); }
  if (featured === 'true' || featured === '1') { sql += ' AND is_featured = 1'; }
  sql += ' ORDER BY sort_order ASC, created_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({ images: rows.map(withAdventure) });
});

router.get('/categories', (req, res) => {
  res.json({ categories: GALLERY_CATEGORIES });
});

// Admin: upload one or more photos at once. Shared metadata (category, adventure_id,
// title prefix, description, featured) applies to every file in the batch; the admin
// can fine-tune each photo's title/caption afterward via PUT /:id.
router.post('/', requireAuth, requireAdmin, upload.array('photos', 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'At least one photo file is required (field name: photos)' });
  }
  const { title, description, category, adventure_id, is_featured } = req.body;

  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) m FROM gallery_images').get().m;
  const insert = db.prepare(`
    INSERT INTO gallery_images (id, title, description, image_url, category, adventure_id, sort_order, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const created = [];
  req.files.forEach((file, i) => {
    const id = uuid();
    const imageUrl = `/uploads/gallery/${file.filename}`;
    const photoTitle = req.files.length > 1 && title ? `${title} (${i + 1})` : (title || null);
    insert.run(id, photoTitle, description || null, imageUrl, category || null, adventure_id || null, maxOrder + i + 1, is_featured ? 1 : 0);
    created.push(withAdventure(db.prepare('SELECT * FROM gallery_images WHERE id = ?').get(id)));
  });

  res.status(201).json({ images: created });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM gallery_images WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Photo not found' });

  const fields = ['title', 'description', 'category', 'adventure_id', 'sort_order', 'is_featured', 'is_active'];
  const updates = {};
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
  if (updates.is_featured !== undefined) updates.is_featured = updates.is_featured ? 1 : 0;
  if (updates.is_active !== undefined) updates.is_active = updates.is_active ? 1 : 0;
  updates.updated_at = new Date().toISOString();

  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE gallery_images SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });

  res.json({ image: withAdventure(db.prepare('SELECT * FROM gallery_images WHERE id = ?').get(req.params.id)) });
});

// Admin: bulk reorder -- body: { order: [id1, id2, id3, ...] } in the desired display order
router.put('/reorder/bulk', requireAuth, requireAdmin, (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of image ids' });
  const update = db.prepare('UPDATE gallery_images SET sort_order = ? WHERE id = ?');
  order.forEach((id, index) => update.run(index, id));
  res.json({ success: true });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM gallery_images WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Photo not found' });

  db.prepare('DELETE FROM gallery_images WHERE id = ?').run(req.params.id);

  // Best-effort: remove the file from disk too, if it lives in our uploads folder
  if (existing.image_url && existing.image_url.startsWith('/uploads/gallery/')) {
    const filePath = path.join(UPLOAD_DIR, path.basename(existing.image_url));
    fs.unlink(filePath, () => {});
  }

  res.json({ success: true });
});

module.exports = router;
