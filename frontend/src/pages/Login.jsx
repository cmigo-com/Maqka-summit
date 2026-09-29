import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api.login(form);
      login(data.token, data.user);
      const dest = location.state?.from || (data.user.role === 'admin' ? '/admin' : '/dashboard');
      navigate(dest);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="section auth-page">
      <h1>Login</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Email
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Password
          <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
      <p><Link to="/forgot-password">Forgot your password?</Link></p>
      <p>Don't have an account? <Link to="/register">Sign up here</Link></p>
    </div>
  );
}
