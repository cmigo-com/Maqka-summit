# Maqka Summit — Hiking & Trekking Booking Platform

A custom-built hiking/trekking website for **Maqka Summit** with a public site, a customer
dashboard, and an admin dashboard for managing adventures, trip dates, bookings, payments,
and email notifications. Payments are manual (bank transfer / cash) — admin records each
payment against a booking, which keeps a real audit trail instead of a status that can be
flipped with no evidence.

See **PROJECT_STATUS.md** for a full changelog of this round of work (files changed,
features added, DB changes, env vars, email/payment config, and remaining tasks).

## Stack
- **Backend:** Node.js + Express + SQLite (`better-sqlite3`), JWT auth, bcrypt password
  hashing, Nodemailer for email
- **Frontend:** React + Vite, React Router

## Project structure
```
maqka-summit/
  backend/     Express API + SQLite database + email service
  frontend/    React client (public site, customer dashboard, admin dashboard)
    public/images/   Your own adventure/mountain photos go here (see images/README.md)
```

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: JWT_SECRET, admin credentials, FRONTEND_URL, and SMTP settings if you want real emails
npm run seed     # creates the admin user + mountains + adventures + trip dates
npm run dev      # starts API on http://localhost:4000
```

Default admin login:
- Email: `bryanwanjohi75@gmail.com`
- Password: `Admin@1234`

**Change this password before the site is ever reachable on a public domain.**

If SMTP isn't configured, emails are logged to the console instead of sent — the app still
works fully in development without a mail server.

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev      # starts React app on http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:4000` in dev, so start the backend first.

## Adding your own photos

See `frontend/public/images/README.md` for the full folder structure and naming
convention (per-mountain folders, home hero, gallery, etc.). Nothing in this project
uses stock or AI-generated photography — the folders are empty until you add real ones.

## Database schema

- `users` — customers and admins, now with `reset_token` / `reset_token_expires` for
  password reset
- `mountains`, `adventures`, `trip_dates` — as before
- `bookings` — status (`pending`/`confirmed`/`completed`/`cancelled`), `total_price`,
  `amount_paid`, `payment_status` (derived from real payments)
- `payments` — every real payment an admin has recorded (amount, method, reference,
  who recorded it) — this is the only way `amount_paid` changes
- `reviews`, `contact_messages`, `notifications` — as before, `notifications` is now
  actually populated and shown on the customer dashboard

## Booking approval flow
1. Customer submits a booking → status `pending` → booking-received email sent
2. Admin reviews it in the Bookings tab (searchable by booking #, name, email, phone,
   adventure, or travel date) → **Approve** (confirmed email sent) or **Cancel** (slots released)
3. Admin records payments as they arrive → payment-received email sent, balance recalculated
4. Admin can send a manual payment reminder email any time there's a balance owing
5. After the trip, admin marks the booking **Completed**

Every status change and payment triggers both an email and an in-app notification
(visible on the customer's dashboard, Notifications tab).

## Next steps / ideas to extend this
- Multi-photo gallery per adventure (currently one `image_url` field — see images/README.md)
- Review submission form for customers (approval workflow already exists server-side)
- Real payment gateway (M-Pesa Daraja, Paystack) if/when you want online payments —
  current system is intentionally manual + audited, per your no-fake-payments rule
- Scheduled/automatic payment reminders (currently a manual admin button)
- Rate limiting on login/register/forgot-password, stricter input validation (e.g. zod)
- Move from SQLite to Postgres for production scale

## Deployment notes
- Backend: any Node host (Render, Railway, a VPS) with a persistent disk for the SQLite
  file, or migrate to Postgres. Set real SMTP credentials and a strong `JWT_SECRET`.
- Frontend: `npm run build` produces a static `dist/` folder for Netlify/Vercel/any static
  host — proxy/rewrite `/api` to your backend's URL in production, and make sure
  `public/images/` photos are included in the deploy.
