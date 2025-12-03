import React, { useState } from 'react';
import './InviteModal.css';

export default function InviteModal({ open, onClose, onSubmit }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Adresse courriel invalide');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit(trimmed);
      setEmail('');
      onClose();
    } catch (err) {
      setError(err?.message || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="invite-modal-backdrop" onClick={onClose}>
      <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="invite-title">Inviter un membre</h2>
        <p className="invite-subtitle">Entrez l'adresse courriel de la personne à inviter.</p>
        <form className="invite-form" onSubmit={handleSubmit}>
          <label className="invite-label" htmlFor="invite-email">Adresse courriel</label>
          <input
            id="invite-email"
            className="invite-input"
            type="email"
            placeholder="exemple@domaine.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
          />
          {error && <div className="invite-error">{error}</div>}
          <div className="invite-actions">
            <button type="button" className="invite-cancel" onClick={onClose} disabled={submitting}>Annuler</button>
            <button type="submit" className="invite-submit" disabled={submitting}>
              {submitting ? 'Envoi…' : 'Envoyer l’invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
