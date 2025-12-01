import React, { useEffect, useState } from "react";
import './Profile.css';
import { useAuth } from "../../context/AuthContext.jsx";
import { useLoading } from "../../context/LoadingContext.jsx";
import { apiFetch } from "../../lib/api.js";

export default function Profile() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleLogout = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await apiFetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Logout failed:', res.status, text);
        alert('Logout failed');
        return;
      }

      localStorage.removeItem('authToken');
      console.log('Logged out via server');
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      alert('Network error during logout');
    }
  }, []);

  const { wrapPromise } = useLoading();

  useEffect(() => {
    if (!token) return;
    wrapPromise(async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch('/auth/getProfile', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Erreur chargement profil');
        }
        const data = await res.json();
        setProfile(data.user || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <main className="profile-page">
      
      <div className="profile-card">
        <div className="profile-avatar-wrapper">
          <img className="profile-avatar" src="https://t4.ftcdn.net/jpg/01/24/65/69/360_F_124656969_x3y8YVzvrqFZyv3YLWNo6PJaC88SYxqM.jpg" alt="Avatar" />
        </div>
        <h1 className="profile-name">{profile ? `${profile.name || ''} ${profile.last_name || ''}`.trim() : '...'}</h1>
        <div className="profile-meta">
          <div className="profile-meta-row">
            <span className="profile-meta-label">Mail</span>
            <span className="profile-meta-value">{profile ? profile.email : '...'}</span>
          </div>
        </div>
        {loading && <div style={{textAlign:'center', fontSize:'0.85rem', color:'#5f6b7a', marginBottom:'0.8rem'}}>Chargement…</div>}
        {error && <div style={{textAlign:'center', fontSize:'0.85rem', color:'#dc2626', marginBottom:'0.8rem'}}>{error}</div>}
        <ul className="profile-actions">
          <li>
            <button type="button" className="profile-action-item" onClick={() => alert('Settings à venir')}> 
              <div className="profile-action-left">
                <span className="profile-action-icon">⚙️</span>
                <span className="profile-action-text">Settings</span>
              </div>
            </button>
          </li>
          <li>
            <button
              type="button"
              data-testid="logout-button"
              onClick={handleLogout}
              className="profile-action-item profile-danger"
            >
              <div className="profile-action-left">
                <span className="profile-action-icon">🔓</span>
                <span className="profile-action-text">Log out</span>
              </div>
            </button>
          </li>
        </ul>
      </div>
    </main>
  );
}
