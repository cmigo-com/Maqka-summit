require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const mountainRoutes = require('./routes/mountains');
const adventureRoutes = require('./routes/adventures');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const notificationRoutes = require('./routes/notifications');
const galleryRoutes = require('./routes/gallery');
const faqRoutes = require('./routes/faqs');
const achievementRoutes = require('./routes/achievements');
const checklistRoutes = require('./routes/checklist');
const routeComparisonRoutes = require('./routes/routeComparison');
const parkFeeRoutes = require('./routes/parkFees');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Maqka Summit API' }));

app.use('/api/auth', authRoutes);
app.use('/api/mountains', mountainRoutes);
app.use('/api/adventures', adventureRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/route-comparison', routeComparisonRoutes);
app.use('/api/park-fees', parkFeeRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.message && (err.message.includes('Only JPG') || err.message.includes('File too large'))) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Maqka Summit API running on http://localhost:${PORT}`));
