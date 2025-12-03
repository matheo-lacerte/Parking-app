import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './waiting.css';

export default function HouseholdWaiting() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true, state: { reason: 'logout' } });
  };

  return (
    <main className="waiting-page">
      <div className="waiting-card">
        <h1 className="waiting-title">En attente d'invitation</h1>
        <p className="waiting-text">
          vous n'êtes pas associé à un foyer.
          Demandez au propriétaire de vous inviter. Vous serez redirigé dès que
          l'association sera faite.
        </p>
        <div className="waiting-actions">
          <button className="waiting-refresh" onClick={handleRefresh}>Rafraîchir l'état</button>
          <button className="waiting-logout" onClick={handleLogout}>Se déconnecter</button>
        </div>
      </div>
    </main>
  );
}
