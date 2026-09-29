import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, resolveAssetUrl } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdventureDetail() {
  const { slug } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [adventure, setAdventure] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ trip_date_id: '', num_adults: 1, num_children: 0, notes: '' });

  useEffect(() => {
    api.getAdventure(slug).then((data) => {
      setAdventure(data.adventure);
      if (data.adventure.tripDates?.length) {
        setForm((f) => ({ ...f, trip_date_id: data.adventure.tripDates[0].id }));
      }
    }).catch((e) => setError(e.message));
  }, [slug]);

  function updateForm(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleBook(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      navigate('/login', { state: { from: `/adventures/${slug}` } });
      return;
    }

    try {
      await api.createBooking(
        {
          adventure_id: adventure.id,
          trip_date_id: form.trip_date_id || null,
          num_adults: Number(form.num_adults),
          num_children: Number(form.num_children),
          notes: form.notes,
        },
        token
      );
      setSuccess('Booking request submitted! Our team will review it and confirm — you\u2019ll see the status update on your dashboard, and we\u2019ll share bank transfer details once approved.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !adventure) return <p className="error section">{error}</p>;
  if (!adventure) return <p className="section">Loading adventure...</p>;

  return (
    <div className="section trek-detail">
      <Link to="/adventures" className="back-link">← Back to Adventures</Link>
      <h1>{adventure.title}</h1>
      {adventure.image_url && (
        <img
          src={resolveAssetUrl(adventure.image_url)}
          alt={`${adventure.title} — ${adventure.route || adventure.location || 'Maqka Summit adventure'}`}
          className="detail-hero-image"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <p className="muted">
        {adventure.category ? `${adventure.category} · ` : ''}{adventure.county ? `${adventure.county} · ` : ''}
        {adventure.location} · {adventure.route} · {adventure.duration_days} days · {adventure.difficulty}
      </p>
      {adventure.max_altitude_m && <p className="muted">Max altitude: {adventure.max_altitude_m}m</p>}
      {adventure.meeting_point && <p className="muted">Meeting point: {adventure.meeting_point}</p>}
      <p>{adventure.description}</p>

      {adventure.highlights?.length > 0 && (
        <>
          <h3>Highlights</h3>
          <ul>{adventure.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
        </>
      )}

      {adventure.itinerary?.length > 0 && (
        <>
          <h3>Itinerary</h3>
          <ul>
            {adventure.itinerary.map((day) => (
              <li key={day.day}><strong>Day {day.day} — {day.title}:</strong> {day.description}</li>
            ))}
          </ul>
        </>
      )}

      <div className="grid-3">
        {adventure.inclusions?.length > 0 && (
          <div>
            <h4>Included</h4>
            <ul>{adventure.inclusions.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
          </div>
        )}
        {adventure.exclusions?.length > 0 && (
          <div>
            <h4>Not Included</h4>
            <ul>{adventure.exclusions.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
          </div>
        )}
        {adventure.type === 'safari' && (adventure.accommodation || adventure.meals || adventure.transport) && (
          <div>
            <h4>Trip Details</h4>
            {adventure.accommodation && <p><strong>Accommodation:</strong> {adventure.accommodation}</p>}
            {adventure.meals && <p><strong>Meals:</strong> {adventure.meals}</p>}
            {adventure.transport && <p><strong>Transport:</strong> {adventure.transport}</p>}
          </div>
        )}
      </div>

      {adventure.reviews?.length > 0 && (
        <>
          <h3>Reviews</h3>
          {adventure.reviews.map((r) => (
            <div className="card" key={r.id} style={{ marginBottom: 10 }}>
              <p><strong>{r.user_name}</strong> — {r.rating}/5</p>
              <p className="muted">{r.comment}</p>
            </div>
          ))}
        </>
      )}

      <div className="booking-box">
        <h3>Book This Adventure</h3>
        <p className="price">Adult: KSh {adventure.price_adult.toLocaleString()} {adventure.price_child ? `· Child: KSh ${adventure.price_child.toLocaleString()}` : ''}</p>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {!success && (
          <form onSubmit={handleBook} className="form">
            {adventure.tripDates?.length > 0 && (
              <label>
                Departure date
                <select value={form.trip_date_id} onChange={(e) => updateForm('trip_date_id', e.target.value)}>
                  {adventure.tripDates.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.start_date} → {d.end_date} ({d.slots_available} slots left)
                    </option>
                  ))}
                </select>
              </label>
            )}
            {(!adventure.tripDates || adventure.tripDates.length === 0) && (
              <p className="muted">No fixed departure dates yet — contact us for a custom date.</p>
            )}

            <div className="form-row">
              <div className="qty-field">
                <span className="qty-label">Adults</span>
                <div className="qty-stepper">
                  <button type="button" onClick={() => updateForm('num_adults', Math.max(1, Number(form.num_adults) - 1))} aria-label="Decrease adults">−</button>
                  <span>{form.num_adults}</span>
                  <button type="button" onClick={() => updateForm('num_adults', Number(form.num_adults) + 1)} aria-label="Increase adults">+</button>
                </div>
              </div>
              <div className="qty-field">
                <span className="qty-label">Children</span>
                <div className="qty-stepper">
                  <button type="button" onClick={() => updateForm('num_children', Math.max(0, Number(form.num_children) - 1))} aria-label="Decrease children">−</button>
                  <span>{form.num_children}</span>
                  <button type="button" onClick={() => updateForm('num_children', Number(form.num_children) + 1)} aria-label="Increase children">+</button>
                </div>
              </div>
            </div>

            <div className="booking-summary">
              <div className="booking-summary-row"><span>Adults</span><span>{form.num_adults} × KSh {adventure.price_adult.toLocaleString()}</span></div>
              {Number(form.num_children) > 0 && (
                <div className="booking-summary-row"><span>Children</span><span>{form.num_children} × KSh {(adventure.price_child || 0).toLocaleString()}</span></div>
              )}
              <div className="booking-summary-row"><span>Total Members</span><span>{Number(form.num_adults) + Number(form.num_children)}</span></div>
              <div className="booking-summary-row booking-summary-total">
                <span>Total Amount</span>
                <span>KSh {((Number(form.num_adults) * adventure.price_adult) + (Number(form.num_children) * (adventure.price_child || 0))).toLocaleString()}</span>
              </div>
            </div>

            <label>
              Notes (dietary needs, fitness level, etc.)
              <textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} rows={3} />
            </label>

            <p className="muted">Payment is by bank transfer or cash — details are shared once your booking is approved.</p>

            <button type="submit" className="btn btn-primary">
              {user ? 'Request Booking' : 'Login to Book'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
