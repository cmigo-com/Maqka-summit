import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api.js';

export default function AdminMessages() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState({ q: '', status: '', is_read: '' });
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [busyId, setBusyId] = useState(null);

  function load(activeSearch = search) {
    api.getContactMessages(token, activeSearch).then((data) => setMessages(data.messages)).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, [token]);

  function updateSearch(field, value) {
    setSearch((s) => ({ ...s, [field]: value }));
  }

  function handleSearch(e) {
    e.preventDefault();
    load(search);
  }

  async function toggleOpen(m) {
    if (openId === m.id) {
      setOpenId(null);
      return;
    }
    setOpenId(m.id);
    setReplyText('');
    if (!m.is_read) {
      try { await api.markMessageRead(m.id, token); load(search); } catch (e) { /* non-fatal */ }
    }
  }

  async function handleMarkUnread(m) {
    try { await api.markMessageUnread(m.id, token); load(search); } catch (e) { setError(e.message); }
  }

  async function handleSetStatus(m, status) {
    try { await api.setMessageStatus(m.id, status, token); load(search); } catch (e) { setError(e.message); }
  }

  async function handleReply(m) {
    if (!replyText.trim()) {
      setError('Write a reply before sending.');
      return;
    }
    setBusyId(m.id);
    setError('');
    try {
      await api.replyToMessage(m.id, replyText, token);
      setReplyText('');
      load(search);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(m) {
    if (!confirm(`Delete the message from ${m.name}? This cannot be undone.`)) return;
    try {
      await api.deleteMessage(m.id, token);
      load(search);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <form className="search-panel" onSubmit={handleSearch}>
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, email, phone, or message content..."
          value={search.q}
          onChange={(e) => updateSearch('q', e.target.value)}
        />
        <div className="filter-grid">
          <label>
            Status
            <select value={search.status} onChange={(e) => updateSearch('status', e.target.value)}>
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
          <label>
            Read status
            <select value={search.is_read} onChange={(e) => updateSearch('is_read', e.target.value)}>
              <option value="">All</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setSearch({ q: '', status: '', is_read: '' }); load({ q: '', status: '', is_read: '' }); }}>Reset</button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="admin-trek-list">
        {messages.map((m) => (
          <div className="card" key={m.id}>
            <div className="booking-card-header" onClick={() => toggleOpen(m)} style={{ cursor: 'pointer' }}>
              <div>
                <h4>{!m.is_read && <span className="status-badge status-pending" style={{ marginRight: 8 }}>New</span>}{m.subject || '(No subject)'} — {m.name}</h4>
                <p className="muted small">{m.email} · {m.phone || 'no phone'} · {m.created_at}</p>
              </div>
              <span className={`status-badge status-${m.status === 'resolved' ? 'completed' : 'pending'}`}>{m.status}</span>
            </div>

            {openId === m.id && (
              <div>
                <p style={{ marginTop: 10 }}>{m.message}</p>
                {m.adventure && <p className="muted small">Re: {m.adventure.title}</p>}

                {m.replies?.length > 0 && (
                  <div className="conversation-thread">
                    {m.replies.map((r) => (
                      <div key={r.id} className="conversation-reply">
                        <p className="muted small">
                          Reply by {r.admin_name || 'Admin'} on {r.created_at.slice(0, 10)}
                          {!r.email_sent && ' — email not sent (SMTP not configured)'}
                        </p>
                        <p>{r.reply_text}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form" style={{ marginTop: 12 }}>
                  <label>
                    Reply to {m.name}
                    <textarea rows={3} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply..." />
                  </label>
                  <div className="form-row small-form" style={{ flexWrap: 'wrap' }}>
                    <button className="btn btn-sm btn-primary" onClick={() => handleReply(m)} disabled={busyId === m.id}>
                      {busyId === m.id ? 'Sending...' : 'Send Reply'}
                    </button>
                    {m.is_read && <button className="btn-link" onClick={() => handleMarkUnread(m)}>Mark Unread</button>}
                    {m.status === 'open'
                      ? <button className="btn-link" onClick={() => handleSetStatus(m, 'resolved')}>Mark Resolved</button>
                      : <button className="btn-link" onClick={() => handleSetStatus(m, 'open')}>Reopen</button>}
                    <button className="btn-link danger" onClick={() => handleDelete(m)}>Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {messages.length === 0 && <p>No messages match your search.</p>}
      </div>
    </div>
  );
}
