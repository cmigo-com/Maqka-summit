import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { BUSINESS_PHONE_DISPLAY, BUSINESS_EMAIL, BUSINESS_LOCATION, WHATSAPP_LINK } from '../constants.js';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', adventure_id: '', message: '' });
  const [adventures, setAdventures] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [messageId, setMessageId] = useState('');

  useEffect(() => {
    api.getAdventures().then((data) => setAdventures(data.adventures)).catch(() => {});
  }, []);

  function updateForm(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const data = await api.submitContactMessage(form);
      setSuccess(data.message);
      setMessageId(data.messageId);
      setForm({ name: '', email: '', phone: '', subject: '', adventure_id: '', message: '' });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="section">
      <h1>Get In Touch</h1>
      <div className="contact-grid">
        <div className="card contact-details-card">
          <h3>Maqka Summit</h3>
          <p className="muted">{BUSINESS_LOCATION}</p>
          <p><strong>Phone:</strong> {BUSINESS_PHONE_DISPLAY}</p>
          <p><strong>Email:</strong> {BUSINESS_EMAIL}</p>
          <p><strong>WhatsApp:</strong> Chat with us on WhatsApp for the fastest response.</p>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="contact-whatsapp-btn" aria-label="Chat with Maqka Summit on WhatsApp">
            Chat on WhatsApp
          </a>
        </div>

        <div className="auth-page" style={{ maxWidth: 'none' }}>
          <p className="muted">No account needed — send us a message and we'll reply by email.</p>
          {error && <p className="error">{error}</p>}
          {success && (
            <div>
              <p className="success">{success}</p>
              <p className="muted small">Reference: {messageId}</p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="form">
              <label>Full Name <input required value={form.name} onChange={(e) => updateForm('name', e.target.value)} /></label>
              <label>Email Address <input type="email" required value={form.email} onChange={(e) => updateForm('email', e.target.value)} /></label>
              <label>Phone Number <input value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} /></label>
              <label>Subject (optional) <input value={form.subject} onChange={(e) => updateForm('subject', e.target.value)} /></label>
              <label>
                Adventure you're interested in (optional)
                <select value={form.adventure_id} onChange={(e) => updateForm('adventure_id', e.target.value)}>
                  <option value="">— Not specific to one adventure —</option>
                  {adventures.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </label>
              <label>Message <textarea required rows={4} value={form.message} onChange={(e) => updateForm('message', e.target.value)} /></label>
              <button type="submit" className="btn btn-primary">Send Message</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
