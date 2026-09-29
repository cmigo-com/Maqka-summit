import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const data = await api.resetPassword(token, password);
      setMessage(data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!token) {
    return (
      <div className="section auth-page">
        <p className="error">This reset link is missing its token. Please use the link from your email.</p>
        <Link to="/forgot-password">Request a new link</Link>
      </div>
    );
  }

  return (
    <div className="section auth-page">
      <h1>Reset Password</h1>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      {!message && (
        <form onSubmit={handleSubmit} className="form">
          <label>
            New password
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label>
            Confirm new password
            <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary">Reset Password</button>
        </form>
      )}
    </div>
  );
}
