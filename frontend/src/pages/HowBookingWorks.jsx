import React from 'react';
import { Link } from 'react-router-dom';

const STEPS = [
  { title: '1. Choose an Adventure', text: 'Browse our adventures and pick a route, difficulty and duration that suits you.' },
  { title: '2. Select a Departure Date', text: 'Pick from our upcoming scheduled departures, or contact us for a custom date.' },
  { title: '3. Enter Trekker Details', text: 'Tell us how many adults and children are joining, and any notes we should know.' },
  { title: '4. Submit Your Booking', text: 'Your booking is created as "pending" while our team reviews availability and details.' },
  { title: '5. Booking Approved', text: 'Once approved, we confirm your slot and share bank transfer/cash payment details.' },
  { title: '6. Pay a Deposit or in Full', text: 'Pay in full or in installments — your dashboard always shows what\u2019s paid and what\u2019s outstanding.' },
  { title: '7. Track on Your Dashboard', text: 'See your booking status, payment history and balance any time you log in.' },
];

export default function HowBookingWorks() {
  return (
    <div className="section">
      <h1>How Booking Works</h1>
      <div className="grid-3">
        {STEPS.map((s) => (
          <div className="card" key={s.title}>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 24 }}>
        Ready to get started? <Link to="/adventures">Browse our adventures</Link>.
      </p>
    </div>
  );
}
