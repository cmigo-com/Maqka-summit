import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const data = await api.forgotPassword(email);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="section auth-page">
      <h1>Forgot Password</h1>
      <p className="muted">Enter your email and we'll send you a link to reset your password.</p>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      {!message && (
        <form onSubmit={handleSubmit} className="form">
          <label>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary">Send Reset Link</button>
        </form>
      )}
      <p><Link to="/login">Back to login</Link></p>
    </div>
  );
}
