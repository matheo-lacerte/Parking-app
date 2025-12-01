import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import './login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur de connexion');
      }
      // Expect access_token from backend
      if (data.access_token) {
        login(data.access_token);
        navigate(from, { replace: true });
      } else {
        throw new Error('Token manquant dans la réponse');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
