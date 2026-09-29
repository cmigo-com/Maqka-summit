const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'maqka_summit.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer', -- 'customer' | 'admin'
  reset_token TEXT,
  reset_token_expires TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mountains (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  region TEXT,
  description TEXT,
  highlights TEXT, -- JSON array, used on the public Destinations page
  image_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS adventures (
  id TEXT PRIMARY KEY,
  mountain_id TEXT REFERENCES mountains(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'trek', -- 'trek' | 'safari' -- Safari Packages reuse this table (see note in PROJECT_STATUS.md)
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT, -- Mountain | Forest | Waterfall | Escarpment | Nature Trail | Crater | Hill Range | National Park | Island | Lake
  county TEXT,
  route TEXT,
  location TEXT,
  duration_days INTEGER,
  difficulty TEXT, -- 'Easy' | 'Moderate' | 'Challenging' | 'Strenuous'
  max_altitude_m INTEGER,
  price_adult REAL NOT NULL,
  price_child REAL,
  max_guests INTEGER DEFAULT 20,
  description TEXT,
  highlights TEXT,   -- JSON array
  inclusions TEXT,   -- JSON array
  exclusions TEXT,   -- JSON array
  itinerary TEXT,    -- JSON array of { day, title, description }
  accommodation TEXT, -- safari packages only
  meals TEXT,          -- safari packages only
  transport TEXT,      -- safari packages only
  meeting_point TEXT,
  image_url TEXT,
  is_active INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trip_dates (
  id TEXT PRIMARY KEY,
  adventure_id TEXT NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  slots_available INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  adventure_id TEXT NOT NULL REFERENCES adventures(id),
  trip_date_id TEXT REFERENCES trip_dates(id),
  num_adults INTEGER DEFAULT 1,
  num_children INTEGER DEFAULT 0,
  total_price REAL NOT NULL,
  amount_paid REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | completed | cancelled
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- unpaid | partial | paid (derived, kept in sync on payment changes)
  notes TEXT,
  admin_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS booking_travelers (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  age INTEGER,
  id_or_passport_number TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Every row here is a real, admin-recorded payment (bank transfer or cash confirmed on receipt).
-- amount_paid on bookings is only ever incremented when a payment row is inserted here,
-- never set directly -- this keeps an auditable trail and honors the "no faked payments" rule.
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  method TEXT NOT NULL DEFAULT 'bank_transfer', -- bank_transfer | cash
  reference TEXT,
  recorded_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  adventure_id TEXT NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  is_approved INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  adventure_id TEXT REFERENCES adventures(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open', -- open | resolved
  created_at TEXT DEFAULT (datetime('now'))
);

-- Every reply an admin sends to a public (possibly not-logged-in) visitor message.
CREATE TABLE IF NOT EXISTS message_replies (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
  admin_id TEXT REFERENCES users(id),
  reply_text TEXT NOT NULL,
  email_sent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'General', -- e.g. 'General' | 'Mount Kenya' -- lets the public FAQ page group by subject
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- "Questions to Ask Before Booking" -- an operator-transparency checklist, editable
-- from the admin dashboard, distinct from the general FAQ.
CREATE TABLE IF NOT EXISTS operator_checklist_items (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Educational "which route should I choose" comparison cards (e.g. 3/4/5-day Point
-- Lenana treks, Sirimon-Chogoria combo, technical climb). price fields stay NULL until
-- an admin supplies a real, verified price -- never auto-filled. linked_adventure_id
-- lets a card's "Book Now" button point at a real bookable adventure once one exists;
-- until then the card shows a WhatsApp enquiry button instead.
CREATE TABLE IF NOT EXISTS route_comparison_cards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  duration_label TEXT,
  route TEXT,
  difficulty TEXT,
  summit_objective TEXT,
  recommended_experience TEXT,
  price_adult REAL,
  price_child REAL,
  availability_note TEXT,
  inclusions TEXT, -- JSON array
  exclusions TEXT, -- JSON array
  linked_adventure_id TEXT REFERENCES adventures(id) ON DELETE SET NULL,
  whatsapp_message TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Park/conservation fees by visitor category. Every row must carry an effective_date
-- and source_url so admins (and visitors) can see how current the figures are --
-- fees are never hard-coded into page copy, since they change and vary by category.
CREATE TABLE IF NOT EXISTS park_fee_categories (
  id TEXT PRIMARY KEY,
  category_label TEXT NOT NULL, -- e.g. 'East African Citizen', 'Kenyan Resident', 'Non-Resident', 'African Citizen', 'Child/Student'
  adult_fee REAL,
  child_fee REAL,
  currency TEXT DEFAULT 'KES',
  effective_date TEXT,
  source_url TEXT,
  included_in_package INTEGER DEFAULT 0,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Left empty until Maqka Summit supplies real, verified achievements -- never seeded
-- with invented numbers, awards, or partnerships.
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT, -- e.g. Completed Adventures | Hikers Served | Summits | Years of Experience | Partnership | Certification | Award
  year TEXT,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  adventure_id TEXT REFERENCES adventures(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`);

module.exports = db;
