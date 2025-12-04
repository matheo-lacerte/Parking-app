import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import './login.css';
import { useLoading } from '../../../context/LoadingContext.jsx';
import { apiFetch } from '../../../lib/api.js';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/';

  const { wrapPromise } = useLoading();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    wrapPromise(async () => {
      try {
        const res = await apiFetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erreur de connexion');
        }
        if (data.access_token) {
          login(data.access_token);

          // Try automatic invite acceptance if a token is present
          let inviteToken = null;
          try {
            const params = new URLSearchParams(window.location.search);
            inviteToken = params.get('invite') || null;
            if (!inviteToken) inviteToken = localStorage.getItem('inviteToken');
          } catch {}

          if (inviteToken) {
            try {
              const acceptRes = await apiFetch('/household/accept', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${data.access_token}`,
                },
                body: JSON.stringify({ invite: inviteToken })
              });
              // Do not block navigation on acceptance errors
              await acceptRes.json().catch(() => ({}));
            } catch {}
            try { localStorage.removeItem('inviteToken'); } catch {}
          }

          navigate(from, { replace: true });
        } else {
          throw new Error('Token manquant dans la réponse');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Connexion</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="auth-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="auth-label" htmlFor="password">Mot de passe</label>
          <input
            id="password"
            className="auth-input"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Patientez…' : 'Se connecter'}
          </button>
        </form>

        <button className="auth-secondary" onClick={() => navigate('/signup')}>
          Créer un compte
        </button>
      </div>
    </div>
  );
};

export default Login;
