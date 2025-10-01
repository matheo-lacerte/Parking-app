import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Success() {
  const location = useLocation();
  const zone = location.state?.zone;

  // Optionally read the last saved report (if present)
  let lastPhoto = null;
  try {
    const reports = JSON.parse(localStorage.getItem('reports') || '[]');
    if (reports.length) {
      const last = reports[reports.length - 1];
      lastPhoto = last?.photo || null;
    }
  } catch (_) {}

  return (
    <main className="main-content" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <h2>Rapport enregistré ✅</h2>
        {zone && <p>Zone sélectionnée: <strong>{zone}</strong></p>}
        {lastPhoto && (
          <div style={{marginTop:12}}>
            <img src={lastPhoto} alt="Dernière photo" style={{maxWidth:240,borderRadius:8}} />
          </div>
        )}
        <div style={{marginTop:16,display:'flex',gap:12,justifyContent:'center'}}>
          <Link className="navbar-link" to="/">Accueil</Link>
          <Link className="navbar-link" to="/profil">Profil</Link>
        </div>
      </div>
    </main>
  );
}
