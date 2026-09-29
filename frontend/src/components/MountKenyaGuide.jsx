import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { WHATSAPP_NUMBER } from '../constants.js';

function waLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message || '')}`;
}

export default function MountKenyaGuide() {
  const [checklist, setChecklist] = useState([]);
  const [cards, setCards] = useState([]);
  const [fees, setFees] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    api.getChecklist().then((d) => setChecklist(d.items)).catch(() => {});
    api.getRouteComparisonCards().then((d) => setCards(d.cards)).catch(() => {});
    api.getParkFees().then((d) => setFees(d.fees)).catch(() => {});
    api.getFaqs('Mount Kenya').then((d) => setFaqs(d.faqs)).catch(() => {});
  }, []);

  return (
    <div className="mk-guide">
      <h2>How to Choose a Mount Kenya Trekking Company</h2>
      <p>
        A responsible operator should be transparent about the trekking route, number of
        days, guide qualifications, porter treatment, park fees, meals, emergency
        planning, accommodation, included and excluded services, equipment provided, and
        weather contingency plans. Before booking, a trustworthy operator should clearly
        communicate safety procedures, a realistic trekking schedule, pricing, and
        participant requirements.
      </p>

      {checklist.length > 0 && (
        <>
          <h3>Questions to Ask Before Booking</h3>
          <div className="mk-checklist">
            {checklist.map((c) => (
              <div className="mk-checklist-item" key={c.id}>
                <p className="mk-question">{c.question}</p>
                <p className="muted">{c.why_it_matters}</p>
              </div>
            ))}
          </div>
          <div className="mk-warning">
            Be cautious when an operator cannot clearly explain route conditions,
            altitude management, guide support, emergency procedures, inclusions,
            exclusions, or payment terms.
          </div>
        </>
      )}

      <h2>What Is the Best Way to Climb Mount Kenya?</h2>
      <p>
        For many trekkers, a guided 4-day or 5-day trek to Point Lenana offers a
        practical balance of acclimatization, safety, scenery, physical preparation,
        summit preparation, and comfortable pacing. The Sirimon ascent and Chogoria
        descent combination may suit travellers who want to experience different sides
        of the mountain, subject to route conditions, availability, budget, and current
        park requirements. A shorter 3-day trek may be more demanding and may provide
        less time for acclimatization — it should not be presented as suitable for
        everyone.
      </p>
      <p>
        Point Lenana is the main trekking summit. Batian and Nelion require specialist
        technical climbing arrangements and should only be considered by suitably
        experienced and equipped climbers with appropriate professional support.
      </p>
      <p style={{ fontWeight: 'bold' }}>
        Mount Kenya does not have one single best route for every traveller. The most
        suitable option depends on fitness, experience, available time, budget, weather,
        route conditions, and the desired summit.
      </p>

      {cards.length > 0 && (
        <>
          <h3>Compare Your Options</h3>
          <div className="grid-3">
            {cards.map((c) => (
              <div className="card mk-compare-card" key={c.id}>
                <h4>{c.title}</h4>
                {c.duration_label && <p className="muted small">{c.duration_label}</p>}
                {c.route && <p><strong>Route:</strong> {c.route}</p>}
                {c.difficulty && <p><strong>Difficulty:</strong> {c.difficulty}</p>}
                {c.summit_objective && <p><strong>Summit:</strong> {c.summit_objective}</p>}
                {c.recommended_experience && <p><strong>Recommended for:</strong> {c.recommended_experience}</p>}
                {c.availability_note && <p className="muted small">{c.availability_note}</p>}
                {c.linkedAdventure?.price_adult ? (
                  <p className="price">From KSh {c.linkedAdventure.price_adult.toLocaleString()}</p>
                ) : (
                  <p className="muted small">Contact us for current pricing</p>
                )}
                <div className="form-row small-form">
                  {c.linkedAdventure ? (
                    <Link to={`/adventures/${c.linkedAdventure.slug}`} className="btn btn-primary btn-sm">Book Now</Link>
                  ) : null}
                  <a href={waLink(c.whatsapp_message)} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                    Ask on WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {fees.length > 0 && (
        <>
          <h3>Park Fees by Category</h3>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Category</th><th>Adult Fee</th><th>Child/Student Fee</th><th>Effective Date</th><th>Source</th></tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f.id}>
                    <td>{f.category_label}</td>
                    <td>{f.adult_fee ? `${f.currency} ${f.adult_fee.toLocaleString()}` : 'Needs verification'}</td>
                    <td>{f.child_fee ? `${f.currency} ${f.child_fee.toLocaleString()}` : 'Needs verification'}</td>
                    <td>{f.effective_date || '—'}</td>
                    <td>{f.source_url ? <a href={f.source_url} target="_blank" rel="noopener noreferrer">Source</a> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">Fees vary by visitor category and change over time — always confirm current figures before finalizing a booking.</p>
        </>
      )}

      {faqs.length > 0 && (
        <>
          <h3>Mount Kenya FAQs</h3>
          <div className="faq-list">
            {faqs.map((f) => (
              <div className="faq-item" key={f.id}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)} aria-expanded={openFaq === f.id}>
                  <span>{f.question}</span>
                  <span className="faq-icon">{openFaq === f.id ? '−' : '+'}</span>
                </button>
                {openFaq === f.id && <div className="faq-answer">{f.answer}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
