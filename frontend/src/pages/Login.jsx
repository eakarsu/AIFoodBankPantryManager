import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoEmail = import.meta.env.VITE_DEMO_EMAIL;
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;
  const demoAvailable = import.meta.env.VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true' && Boolean(demoEmail && demoPassword);

  const fillDemoCredentials = () => {
    if (!demoAvailable) return;
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🏦</div>
          <h1>Food Bank AI</h1>
          <p className="login-subtitle">Pantry Management System</p>
        </div>
        <form id="login-form" className="login-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <button type="button" className="btn btn-secondary btn-block" onClick={fillDemoCredentials} disabled={!demoAvailable || loading} style={{ marginTop: '10px' }}>
            Fill Demo Credentials
          </button>
          {!demoAvailable && <p role="status">Demo credentials are not configured for this session.</p>}
        </form>
        <div className="login-footer">
          <p>Powered by AI &bull; OpenRouter + Claude</p>
        </div>
      </div>
    </div>
  );
}
