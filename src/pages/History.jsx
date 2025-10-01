import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import './History.css';

export default function History() {
  const reports = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('reports') || '[]');
    } catch (e) {
      return [];
    }
  }, []);

  return (
    <main className="main-content">
      <div className="history-screen">
        <header className="history-header">
          <h2 className="history-title">Historique</h2>
        </header>

        {reports.length === 0 ? (
          <div className="history-empty">
            <svg className="history-empty-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 5h4l2-2h4l2 2h4v14H4V5z" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <div>Aucun rapport enregistré.</div>
          </div>
        ) : (
          <ul className="history-list">
            {reports.map((r) => (
              <li key={r.id} className="history-item">
                {r.photo ? (
                  <img className="history-thumb" src={r.photo} alt="photo" />
                ) : (
                  <div className="history-thumb history-thumb--empty">Sans photo</div>
                )}
                <div className="history-meta">
                  <div className="history-zone">{r.zone || 'Zone inconnue'}</div>
                  <div className="history-date">{new Date(r.date).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="history-actions">
          <Link className="navbar-link" to="/">Retour</Link>
        </div>
      </div>
    </main>
  );
}
