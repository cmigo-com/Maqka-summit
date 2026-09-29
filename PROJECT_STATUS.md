# Project Status — Maqka Summit

## Round 9 — Mount Kenya educational content + full build/deploy audit

**Part A: Mount Kenya content** (per the operator-transparency brief). Added, all
admin-editable, nothing invented:
- `operator_checklist_items` table + admin tab — the 10 "Questions to Ask Before
  Booking" with a warning panel, shown on the Mount Kenya destination page
- `route_comparison_cards` table + admin tab — the 5 comparison cards (3/4/5-day
  Lenana, Sirimon–Chogoria, Batian/Nelion technical climb). **No prices were seeded** —
  each card shows "Contact us for current pricing" until an admin sets a price or links
  the card to a real priced adventure (new `linked_adventure_id`, so "Book Now" routes
  to an actual bookable product)
- `park_fee_categories` table + admin tab — 5 fee categories (East African Citizen,
  Kenyan Resident, Non-Resident, African Citizen, Child/Student), each with
  `effective_date` and `source_url` fields. **No fee amounts were seeded** — every row
  says "Needs verification" until an admin enters a real figure with its source
- `faqs` gained a `topic` field — 10 new Mount Kenya FAQs seeded (topic='Mount Kenya'),
  public `/faq` page now groups by topic, admin FAQ tab shows/edits topic
- New `MountKenyaGuide` component renders all of the above on `/destinations/mount-kenya`
  specifically (conditional on slug, so no other destination page changed)
- **Section 6 ("Responsible Booking Information") was cut off with no content in your
  message** — everything through section 5 is built; resend section 6 when ready

**Part B: Full build/deploy audit**, checked against your 12 points. Verified using the
actual tools (SQLite engine, TypeScript compiler, esbuild bundler) rather than
inspection alone, since a live `npm install` isn't possible in this environment
(outbound network is disabled here) — see the testing commands below to confirm this
in your own environment too.

| # | Check | Result |
|---|---|---|
| 1 | package.json dependencies | Every `require`/`import` cross-checked against declared deps — none missing, none unused |
| 2 | npm install compatibility | Versions are a standard, mutually-compatible set (React 18 / Router 6 / Vite 5) |
| 3 | npm run build | Simulated with esbuild bundling the full module graph from `main.jsx` — succeeds |
| 4 | Import paths | All 91 frontend + 46 backend relative imports resolve, verified programmatically |
| 5 | Missing files/components | None found |
| 6 | Filename case-sensitivity | Verified on a case-sensitive filesystem (same as Linux/Vercel build machines) |
| 7 | React/Vite config | `vite.config.js`, `main.jsx`, `index.html` all correct |
| 8 | Routing | No duplicate paths, correct v6 API usage, catch-all route last |
| 9 | Environment variables | All `process.env.*` reads (including destructured ones) cross-checked against `.env.example` |
| 10 | JS syntax errors | 0 errors — every backend file via `node --check`, every frontend file via `tsc` in loose JSX mode |
| 11 | Broken image/asset paths | Found real gaps — see below |
| 12 | Vercel compatibility | Found a real, significant gap — see below |

**Real issues found and fixed:**
1. **No SPA rewrite rule for Vercel** — a client-side-routed app with no rewrite config
   404s on Vercel for any route besides `/` (refreshing `/adventures` or sharing a direct
   link would break). Added `frontend/vercel.json`.
2. **Frontend had no way to reach a separately-deployed backend** — `api.js` hardcoded
   `/api` as a relative path, which only works because `vite.config.js`'s dev proxy
   forwards it locally. In production, with the frontend on Vercel and the backend
   elsewhere, every API call would 404. Added `VITE_API_BASE_URL` (documented in a new
   `frontend/.env.example`) and a `resolveAssetUrl()` helper so uploaded-photo URLs
   (`/uploads/...`, served by the backend) resolve correctly even when the frontend and
   backend are on different domains — updated all 9 files that render an `image_url`.
3. **No `.gitignore` anywhere** — `node_modules`, `.env` secrets, and the SQLite database
   could all get committed. Added a root `.gitignore` (careful to *not* exclude
   `backend/public/uploads/`, since that folder currently ships the real seed photos the
   gallery depends on, not just throwaway runtime uploads).
4. **Stale `.env.example` value** — `SMTP_USER` still said `summittrails@gmail.com` from
   before the Round 8 rebrand (the rename pass only covered code files, not `.env.example`).
   Fixed to match `EMAIL_FROM`.
5. **Six seeded destination photos still point at files that don't exist yet**
   (`aberdare-range`, `hells-gate`, `kereita-forest`, `loita-hills`, `menengai-crater`,
   `mount-mtelo` hero images) — this is expected, not a bug: per your standing instruction
   to use only real supplied photos, these stay unfilled until you provide them, and the
   `onError` handler already hides a missing image gracefully instead of showing a broken
   icon. Filled in the 5 that *do* have a matching real photo already uploaded earlier
   in this project (Mount Kenya hero/trail/camp images, Longonot crater-rim trail).
6. **No `engines` field** — added `"node": ">=18.0.0"` to both `package.json` files so
   deploy platforms that read it (Render, Vercel) provision a compatible Node version for
   `better-sqlite3`'s native bindings.

**Architectural note on Vercel specifically** (not a bug to "fix," a platform fit issue):
Vercel's serverless functions have an ephemeral, mostly read-only filesystem — a SQLite
file and admin-uploaded gallery photos would not persist between requests or deployments
there. Deploy the **frontend** (this Vite/React build) on Vercel; deploy the **backend**
(Express + SQLite + file uploads) on a host with a persistent disk and a long-running
process instead — Render, Railway, Fly.io, or a VPS, exactly as `README.md` already
recommended. Then set `VITE_API_BASE_URL` on Vercel to point at that backend.

**Exact commands to test:**

Local (two terminals):
```bash
# Terminal 1 -- backend
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev          # http://localhost:4000

# Terminal 2 -- frontend
cd frontend
npm install
cp .env.example .env.local   # leave VITE_API_BASE_URL blank for local dev
npm run dev           # http://localhost:5173
```

Production build check (run before deploying, catches build-time errors early):
```bash
cd frontend
npm install
npm run build          # outputs to frontend/dist/
npm run preview        # serve the production build locally to sanity-check it
```

GitHub Codespaces:
```bash
# In the Codespace terminal, from the repo root
cd backend && npm install && cp .env.example .env && npm run seed && npm run dev &
cd ../frontend && npm install && npm run dev
```
Codespaces will prompt to forward ports 4000 and 5173 — open the forwarded 5173 URL.
If Codespaces makes the frontend port URL public/different from `localhost`, set
`VITE_API_BASE_URL` in `frontend/.env.local` to the forwarded backend URL (the 4000
one) with `/api` appended, since cross-port forwarding in Codespaces uses different
hostnames per port rather than `localhost:4000`.

---

## Round 8 — Full rebrand: Summit Trails → Maqka Summit Adventures and Tours

Per your uploaded logo, the site's brand name changed from "Summit Trails" back to
**Maqka Summit** (full legal form: "Maqka Summit Adventures and Tours"), to match the
logo exactly rather than run two names in parallel.

**What was done:**
- Every customer-facing and code-level mention of "Summit Trails" / "SUMMIT TRAILS"
  replaced with "Maqka Summit" / "MAQKA SUMMIT" — navbar, footer, all page copy, email
  templates (subjects, headers, signatures), page `<title>`, README
- Navbar subtitle now reads "Adventures and Tours" (matching the logo's subtitle) instead
  of "Guided Hiking & Trekking"
- Footer tagline reverted to **"Explore. Experience. Conquer."** — the logo's actual
  tagline — replacing "Explore. Discover. Adventure."
- Footer copyright line now uses the full legal name: "© Maqka Summit Adventures and
  Tours. All rights reserved."
- Email header subtitle changed to "ADVENTURES AND TOURS" to match the logo
- Database file renamed `summit_trails.sqlite` → `maqka_summit.sqlite`
- Seeded admin display name, gallery captions, and FAQ text updated to the new name

**Left unchanged (not brand-name related):**
- Admin login email (`bryanwanjohi75@gmail.com`) and business contact email
  (`waltermichael357@gmail.com`) — these are addresses, not the brand name
- Phone number, WhatsApp number, and Nanyuki location
- npm package names (`maqka-summit-backend`/`frontend`) — these were never changed
  during the earlier "Summit Trails" rounds, so nothing to revert there

**Action needed on your end:** if you'd already run `npm run seed` under the old
`summit_trails.sqlite` filename, that data won't automatically carry over to the new
filename. Either rename your existing `.sqlite` file to `maqka_summit.sqlite` to keep
your data, or delete it and re-run `npm run seed` for a fresh start.

---

## Round 7 — Public messaging + replies, FAQ, Destinations, Achievements, Safari Packages, booking stepper

**What was requested:** a large feature set — public no-login contact messaging with
admin replies, a FAQ page, Destinations page, Achievements page, Safari Packages, a
proper adults/children quantity stepper with live totals, capacity/price-protection
confirmation, and full nav/admin coverage for all of it.

**Key engineering decision — Safari Packages reuse the `adventures` table.**
Rather than a parallel `safari_packages` table (which would duplicate every piece of
the booking, pricing, slots, and price-protection logic that already works and is
tested), `adventures` gained a `type` column (`trek` | `safari`) plus three
safari-only fields (`accommodation`, `meals`, `transport`). The Adventures page now
filters `type=trek`, the new Safari Packages page filters `type=safari`, and both
reuse the exact same booking flow, admin form, and price-lock guarantee. No safari
packages are seeded — that catalogue is empty until you provide official packages/prices,
per your instruction not to invent prices.

**What was done:**
- **Public messaging, no login required:** `Contact.jsx` already existed; extended with
  optional Subject and "Adventure you're interested in" fields, and now shows a
  confirmation with a reference/message ID on submit
- **Admin reply system:** new `message_replies` table; admin can open a conversation,
  see the full thread, reply (stored + emailed to the visitor directly, no account
  needed), mark read/unread, mark resolved/reopen, search by name/email/phone/message
  text, filter by status/read-state, and delete. Reply emails never expose the admin's
  own address — they go out from the shared Summit Trails support address
- **FAQ system:** `faqs` table, public `/faq` accordion page, seeded with 14 FAQs
  covering your requested list (using only verified platform behavior — the
  cancellation-policy FAQ is flagged "needs verification" since I don't know your
  official refund policy). Admin can add/edit/delete/reorder/activate-deactivate
- **Destinations page:** `/destinations` (list) and `/destinations/:slug` (detail),
  built on the existing `mountains` table (now with a `highlights` field) rather than a
  new table — a destination *is* what "mountain" already meant, so this avoids
  duplicate data entry. Each destination page lists its live adventures. New admin
  "Destinations" tab for full CRUD
- **Achievements page:** `/achievements`, `achievements` table, admin CRUD. Seeded
  empty with a clean "coming soon" state — per your instruction, nothing invented
- **Safari Packages page:** `/safari-packages`, empty until you provide packages (see
  engineering decision above)
- **Booking quantity stepper:** adults/children now use +/− stepper buttons (minimum
  1 adult, minimum 0 children) with a live summary showing Adults × price, Children ×
  price, Total Members, and Total Amount — recalculated as you click, before submitting
- **Navigation:** full nav now includes Home, About Us, Adventures, Destinations, Safari
  Packages, Gallery, Achievements, FAQ, Contact, Login/Register, plus a mobile hamburger
  menu that collapses the nav below 860px
- **Confirmed, no changes needed:** available-slots enforcement (booking creation
  already checks `trip_dates.slots_available` and rejects overbooking with a clear
  error) and price protection (booking's `total_price` is still fixed at creation,
  confirmed again with the new `type` field in place) — both were already correct from
  earlier rounds and still hold with safari packages included

**Database changes:** `contact_messages` gained `adventure_id` and `status`
(open/resolved); new `message_replies`, `faqs`, `achievements` tables; `mountains`
gained `highlights`; `adventures` gained `type`, `accommodation`, `meals`, `transport`.

**Files changed (highlights):** `backend/src/db/index.js`, `backend/src/db/seed.js`,
`backend/src/routes/contact.js` (rewritten), `backend/src/routes/mountains.js`
(rewritten), `backend/src/routes/adventures.js`, `backend/src/routes/faqs.js` (new),
`backend/src/routes/achievements.js` (new), `backend/src/server.js`, `backend/src/
services/emailTemplates.js`, `frontend/src/api.js`, `frontend/src/App.jsx`,
`frontend/src/components/Navbar.jsx` (rewritten, hamburger menu), `frontend/src/pages/
FAQ.jsx`, `Destinations.jsx`, `DestinationDetail.jsx`, `Achievements.jsx`,
`SafariPackages.jsx` (all new), `frontend/src/pages/AdventureDetail.jsx` (stepper +
live total), `frontend/src/pages/Adventures.jsx` (type=trek filter), `frontend/src/
pages/Contact.jsx` (rewritten), `frontend/src/components/admin/AdminMessages.jsx`
(rewritten), `AdminAdventures.jsx` (type + safari fields), `AdminFaqs.jsx`,
`AdminAchievements.jsx`, `AdminDestinations.jsx` (all new), `AdminDashboard.jsx`,
`frontend/src/styles.css`.

**Not done / remaining:**
- Visitor-side email threading (replying to the email itself to continue the
  conversation) — the brief explicitly allowed deferring this if not yet configured;
  the database structure (`message_replies`) is ready to connect a provider that
  supports inbound email parsing (e.g. Postmark inbound, SendGrid Inbound Parse) later
- FAQ/Achievements/Destinations admin CRUD has no image upload (paste a URL/path, same
  pattern as Adventures) — could reuse the gallery's multer upload if wanted
- Achievements and Safari Packages are intentionally empty — waiting on your real data

---

## Round 6 — Admin login email changed

Admin login email is now `bryanwanjohi75@gmail.com` (password unchanged: `Admin@1234`).
Updated in `backend/.env.example` and the `seed.js` fallback default. If a database was
already seeded under the old `summittrails@gmail.com` admin account, either delete the
`.sqlite` file and re-seed, or log in with the old email and update it directly.

---

## Round 5 — Official contact details + floating WhatsApp button

**What was requested:** roll out the official phone (0713177186), email
(waltermichael357@gmail.com), and location (Nanyuki, Kenya) consistently across the
site, and add a floating WhatsApp chat button.

**What was done:**
- New `frontend/src/constants.js` — single source of truth for phone/email/location and
  the WhatsApp link (international format `254713177186`, pre-filled message), so future
  contact-detail changes only need editing in one place
- **Floating WhatsApp button** (`WhatsAppButton.jsx`) — fixed bottom-right on every page,
  opens `wa.me` with the pre-filled message, accessible label
  ("Chat with Summit Trails on WhatsApp"), responsive sizing on mobile
- **Contact page** rebuilt: "Get In Touch" heading, a details card (location, phone,
  email, "Chat on WhatsApp" button) alongside the existing contact form (name, email,
  phone, message, Send Message)
- **Footer** rebuilt: new tagline "Explore. Discover. Adventure.", Nanyuki/Kenya, phone,
  email, WhatsApp + Contact Us links, and a Quick Links column (Home, Adventures, About,
  Gallery, Contact, Login/Register)
- **Home page**: new "Ready to Start Planning?" CTA section with Call/WhatsApp/Contact
  Us buttons
- **About page**: added a "Find Us" contact card
- **Emails**: footer line and the two in-body support mentions (booking confirmed,
  payment reminder) updated to the new phone/email

**Deliberately left unchanged at the time:** the admin login email (was
`summittrails@gmail.com` / `Admin@1234`) — that was an internal
account credential, not the public contact info this request covers. If you'd like the
admin account itself to use `waltermichael357@gmail.com`, say so and I'll update
`ADMIN_EMAIL` and re-seed.

**Files changed:** `frontend/src/constants.js` (new), `frontend/src/components/
WhatsAppButton.jsx` (new), `frontend/src/components/Footer.jsx`, `frontend/src/pages/
Contact.jsx`, `frontend/src/pages/About.jsx`, `frontend/src/pages/Home.jsx`,
`frontend/src/App.jsx`, `frontend/src/styles.css`, `backend/src/services/
emailTemplates.js`, `backend/src/services/email.js`, `backend/.env.example`.

---

## Round 4 — Photo Gallery (public page + homepage preview + admin management)

**What was requested:** a dedicated gallery page using the client's own uploaded photos
(no stock/AI images), category filters, a lightbox, a homepage preview section, and
admin upload/management tools added to the existing Admin Dashboard.

**What was done:**
- New `gallery_images` table: title, description, image_url, category, adventure_id,
  sort_order, is_featured, is_active
- New `/api/gallery` routes: public listing (filterable by category/featured/adventure),
  admin multi-file upload (`multer`, up to 20 photos at once, 8MB each, JPG/PNG/WEBP only),
  edit, delete (also removes the file from disk), and bulk reorder
- Uploaded files are stored on disk at `backend/public/uploads/gallery/` and served at
  `/uploads/gallery/...`; Vite's dev proxy now forwards `/uploads` to the backend too
- **Gallery page** (`/gallery`): "Explore Our Adventures" heading, masonry grid (CSS
  columns, responsive 1/2/3 columns), category filter pills (All/Mountains/Hikes/
  Waterfalls/Forests/Experiences), lightbox with keyboard + button navigation, lazy
  loading, real alt text, and a clean empty state per category
- **Homepage preview** ("Moments From The Trail"): up to 8 featured photos + a
  "View Full Gallery" button
- **Admin Gallery tab** (new, alongside the existing Overview/Bookings/Adventures/
  Clients/Messages tabs — nothing removed): upload form with title/description/category/
  adventure/featured, and a grid of every photo with inline-editable title, category,
  adventure link, featured/active toggles, sort order, and delete

**Real photos included right now — nothing generated or stock:**
I used the photos you've uploaded across this conversation. 13 are your original Mount
Kenya trekking photos (peaks, giant groundsels/lobelia, Shipton's Camp, the park
signpost, guides packing gear, the hiking group) — these are confidently categorized.
The 4 you just uploaded (escarpment/gorge view, aerial crater, crater-rim trail with a
hiker, forest waterfall) are tagged as Mount Longonot (the two crater shots) and a
**best-guess, flagged-for-your-confirmation** tag on the other two (Hell's Gate for the
escarpment/gorge photo, "Waterfalls" for the forest waterfall) — I wasn't certain enough
of the exact location to state it as fact, so please correct the category/title on those
two in the Admin → Gallery tab if I guessed wrong.

**Files changed:** `backend/src/db/index.js`, `backend/src/routes/gallery.js` (new),
`backend/src/server.js`, `backend/src/db/seed.js`, `backend/package.json` (added
`multer`), `frontend/src/api.js`, `frontend/vite.config.js`, `frontend/src/pages/
Gallery.jsx` (new), `frontend/src/pages/Home.jsx`, `frontend/src/components/admin/
AdminGallery.jsx` (new), `frontend/src/pages/AdminDashboard.jsx`, `frontend/src/App.jsx`,
`frontend/src/components/Navbar.jsx`, `frontend/src/styles.css`.

**Not done / remaining:**
- True drag-and-drop reordering (currently a numeric "Order" field per photo — functional,
  less slick than dragging)
- Image resizing/compression on upload (files are stored as uploaded; for production,
  add a resize step, e.g. `sharp`, so large phone photos don't slow the site down)
- Confirm the two flagged photo categories above

---

## Round 3 — Destination research + category/county/featured filtering + price-lock confirmation


**What was requested:** structure Tripadvisor-sourced research into an original destination
catalogue (no copied wording, no fake testimonials, no invented prices/fees), extend
search/filtering, confirm confirmed-booking prices don't move when an adventure's price
changes later.

**What was done:**
- `DESTINATION_RESEARCH.md` — all 32 candidate destinations, each tagged well-established
  vs. needs-verification, with original 1-2 sentence descriptions for the well-established
  ones. **Nothing was auto-published** — this is reference material for Summit Trails to
  approve, correct, and price before anything goes live, per the brief's explicit instruction
  not to publish uncertain facts or invented prices.
- `adventures` table gained `category`, `county`, `is_featured` columns
- Public adventure search (`GET /adventures`) now also filters by `category`, `county`,
  `featured=true`; new `GET /adventures/meta/filters` returns the distinct categories/
  counties currently in use, to populate dropdowns dynamically (no hardcoded lists)
- Adventures page: added Category, County, and "Featured only" filters alongside the
  existing mountain/difficulty/duration/price/date filters; featured adventures now sort
  first and show a "Featured" badge
- Admin Adventures form: added Category (dropdown), County (text), and a Featured checkbox;
  admin list shows a Featured badge and the category/county on each card
- Existing seeded adventures tagged with real category/county values (e.g. Mount Kenya
  routes → Mountain, Meru/Nyeri/Laikipia; Hell's Gate → National Park, Nakuru); the two
  flagship Mount Kenya routes marked Featured
- **Confirmed, no code change needed:** `bookings.total_price` is computed once at booking
  creation from the adventure's price at that moment and stored on the booking row — an
  admin changing an adventure's price afterward never touches existing bookings. This was
  already correct in the existing booking system.

**Files changed:** `backend/src/db/index.js`, `backend/src/routes/adventures.js`,
`backend/src/db/seed.js`, `frontend/src/api.js`, `frontend/src/pages/Adventures.jsx`,
`frontend/src/pages/AdventureDetail.jsx`, `frontend/src/components/admin/AdminAdventures.jsx`,
`frontend/src/styles.css`. Admin/Customer dashboards were extended, not rebuilt — no
existing functionality was removed.

**Remaining before any of the 32 researched destinations go live:**
1. Summit Trails reviews `DESTINATION_RESEARCH.md` and confirms which destinations to pursue
2. Official prices, fees, and any uncertain facts get supplied (never invented by this system)
3. Real Summit Trails photos get dropped into `frontend/public/images/mountains/<slug>/`
   (create new subfolders there for non-mountain categories as needed, e.g.
   `public/images/forests/karura-forest/`)
4. Admin adds each approved destination via the Adventures tab (category/county/featured
   fields are ready), or asks for a batch seed script once details are finalized

---



## Round 2 — Search & filters, email system, forgot/reset password, notifications

Scope of this update: search & filters, real photo structure, full email notification
system, forgot/reset password, admin booking search, notifications on the customer
dashboard. The existing Admin Dashboard and Customer Dashboard were **not** rebuilt —
both were extended in place.

## 1. Files changed

**Backend**
- `src/db/index.js` — added `reset_token`/`reset_token_expires` to `users`
- `src/routes/auth.js` — welcome email on register, `PUT /auth/me` (profile update),
  `POST /auth/forgot-password`, `POST /auth/reset-password`
- `src/routes/adventures.js` — search now supports `duration_min/max`, `price_min/max`,
  `departure_date` in addition to existing `q`, `difficulty`, `mountain`
- `src/routes/bookings.js` — email + in-app notification on booking created/approved/
  cancelled/completed/payment recorded/status changed; admin `GET /bookings` now supports
  `q`, `status`, `payment_status`, `date` search; added `POST /:id/remind`
- `src/routes/notifications.js` — **new**: `GET /mine`, `PUT /:id/read`, `PUT /read-all`
- `src/services/email.js` — **new**: Nodemailer transport, console-log fallback when
  SMTP isn't configured
- `src/services/emailTemplates.js` — **new**: 7 branded HTML email templates
- `src/server.js` — mounted the new notifications route
- `.env.example` — added `FRONTEND_URL` and SMTP settings
- `package.json` — added `nodemailer`

**Frontend**
- `src/api.js` — added profile update, forgot/reset password, notifications, payment
  reminder, richer search params
- `src/pages/Adventures.jsx` — full search/filter panel (mountain, difficulty, duration
  bucket, min/max price, departure date) + empty state + adventure card photos
- `src/pages/AdventureDetail.jsx` — hero photo on the detail page
- `src/pages/Home.jsx` — featured adventure card photos
- `src/pages/ClientDashboard.jsx` — now tabbed: **My Bookings** (unchanged data, same
  cards), **Notifications** (new), **Profile** (new, edit name/phone)
- `src/pages/ForgotPassword.jsx`, `src/pages/ResetPassword.jsx` — **new**
- `src/pages/Login.jsx` — added "Forgot your password?" link
- `src/components/admin/AdminBookings.jsx` — added the search/filter panel, "Send
  Payment Reminder" button
- `src/App.jsx` — added `/forgot-password`, `/reset-password` routes
- `src/styles.css` — search panel, filter grid, empty state, image, and notification
  styles
- `frontend/public/images/**` — **new**: structured, empty folders for real photos +
  `README.md` explaining the convention
- `src/db/seed.js` (backend) — adventure `image_url` values updated to the new
  `/images/mountains/<slug>/...` paths

**Not touched:** Admin Overview stats, Adventures CRUD tab, Clients tab, Messages tab,
mountains routes, contact routes, core auth (login/register logic), booking creation
logic, the DB tables that already existed — all preserved as-is.

## 2. Features added
- Adventure search with mountain/difficulty/duration/price/departure-date filters +
  clear empty state
- Admin booking search by booking number, customer name, email, phone, adventure, or
  travel date, plus status/payment-status filters
- Full email system: welcome, password reset, booking received, booking confirmed,
  payment received, payment reminder (manual trigger), booking status update — all
  using one shared branded HTML template
- Forgot/reset password flow (didn't exist before)
- In-app notifications, populated automatically and shown on the customer dashboard
- Customer profile editing (name/phone)
- Structured photo folders + real `<img>` rendering (lazy-loaded, alt text, graceful
  fallback) across adventure cards, the adventure detail page, and featured adventures
  on Home — replacing the placeholder Unsplash hero image

## 3. Existing features preserved
- Registration/login/JWT auth
- Admin approve/cancel/complete booking actions
- Payment recording and the audit-trail `payments` table
- Adventures/mountains/trip-dates admin CRUD
- Clients list, contact messages inbox
- Customer dashboard's core booking view (total/paid/balance/status) — extended, not replaced

## 4. Database changes
- `users` gained `reset_token TEXT` and `reset_token_expires TEXT`
- No other tables changed structurally this round (`notifications` already existed
  but was unused — it's now actively written to and read)

## 5. Environment variables required
```
PORT=4000
JWT_SECRET=<long random string>
ADMIN_EMAIL=summittrails@gmail.com
ADMIN_PASSWORD=<change this>
FRONTEND_URL=http://localhost:5173        # used to build links inside emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=summittrails@gmail.com
SMTP_PASS=<gmail app password>
EMAIL_FROM=Summit Trails <summittrails@gmail.com>
```

## 6. Email configuration required
This uses **Nodemailer over SMTP** — no third-party email API needed, but you do need
real credentials before emails actually send:
1. Enable 2-factor authentication on the `summittrails@gmail.com` Google account
2. Generate a Gmail **App Password** (Google Account → Security → App Passwords)
3. Put that app password in `SMTP_PASS` in `.env` (not the normal Gmail password)
4. Without this, the app still works — emails are logged to the backend console
   instead of sent, so nothing breaks in development

For production at higher volume, consider a transactional email provider (Resend,
Postmark, SES) instead of Gmail SMTP, which has sending limits.

## 7. Payment configuration required
**None yet, by design.** Per the no-fake-payments rule, there is still no online payment
gateway — admin manually records bank transfer/cash payments, each one an auditable row
in the `payments` table. If/when you want real online payments (M-Pesa Daraja, Paystack,
etc.), that's a separate integration: the callback/webhook from the provider would be
the only thing allowed to insert a `payments` row automatically, verified server-side,
never trusted from the frontend.

## 8. Remaining tasks before production deployment
- Swap Gmail SMTP for a production-grade email provider if volume grows
- Move from SQLite to Postgres (or keep SQLite on a persistent disk if traffic is low)
- Add rate limiting to login/register/forgot-password (brute-force protection)
- Add server-side input validation (e.g. zod/celebrate) beyond the current ad-hoc checks
- Real photo upload flow for admins (currently paste-a-path/URL) if you don't want to
  manually drop files into `public/images/`
- Multi-photo gallery per adventure (schema + UI) if one hero photo per adventure isn't enough
- HTTPS/TLS termination and a real domain
- Automated/scheduled payment reminders (currently a manual admin button)
- Review submission UI for customers (backend/admin-approval already supports it)
