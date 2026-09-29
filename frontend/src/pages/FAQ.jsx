import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

function FaqItem({ faq, isOpen, onToggle }) {
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={onToggle} aria-expanded={isOpen}>
        <span>{faq.question}</span>
        <span className="faq-icon">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div className="faq-answer">{faq.answer}</div>}
    </div>
  );
}

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getFaqs().then((data) => setFaqs(data.faqs)).catch((e) => setError(e.message));
  }, []);

  const grouped = faqs.reduce((acc, f) => {
    const topic = f.topic || 'General';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(f);
    return acc;
  }, {});
  const topics = Object.keys(grouped);

  return (
    <div className="section" style={{ maxWidth: 800 }}>
      <h1>Frequently Asked Questions</h1>
      <p className="muted">Everything you need to know about booking and hiking with Maqka Summit.</p>
      {error && <p className="error">{error}</p>}

      {topics.map((topic) => (
        <div key={topic} style={{ marginBottom: 28 }}>
          {topics.length > 1 && <h2 style={{ marginTop: 30 }}>{topic}</h2>}
          <div className="faq-list">
            {grouped[topic].map((f) => (
              <FaqItem key={f.id} faq={f} isOpen={openId === f.id} onToggle={() => setOpenId(openId === f.id ? null : f.id)} />
            ))}
          </div>
        </div>
      ))}
      {faqs.length === 0 && !error && <p>No FAQs published yet.</p>}
    </div>
  );
}
