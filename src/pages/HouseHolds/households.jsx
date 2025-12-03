import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLoading } from "../../context/LoadingContext.jsx";
import { apiFetch } from "../../lib/api.js";
import "./households.css";

export default function Home() {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [address, setAddress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const { wrapPromise } = useLoading();

  useEffect(() => {
    if (!token) return;
    // Fetch current user profile to know who is logged in
    wrapPromise(async () => {
      try {
        const res = await apiFetch('/auth/getProfile', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data?.user?.id ?? null);
        }
      } catch (_) {
        // ignore profile errors here; button will just not show
      }
    });
    wrapPromise(async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch('/household/members', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Erreur chargement membres du foyer');
        }
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    });
    wrapPromise(async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch('/household/address', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Erreur chargement adresse du foyer");
        }
        const data = await res.json();
        setAddress(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    });
  }, [token, wrapPromise]);

  return (
    <main className="households-page">
      <div className="households-card">
        <h1 className="households-name">Foyer {address?.address}</h1>
        {members.length === 0 && !loading && !error && (
          <div className="households-empty">Aucun membre trouvé.</div>
        )}
        <h2 className="households-members-title">Membres du foyer</h2>
        {members.length > 0 && (
          <ul className="household-list">
            {members.map((m) => (
              <li key={m.user_id} className="household-item">
                <div className="household-item-name">
                  {(m.name || m.last_name) ? `${m.name ?? ''} ${m.last_name ?? ''}`.trim() : m.email || m.user_id}
                </div>
                <div className="household-item-meta">
                  {m.role === 'Owner' ? 'Propriétaire' : 'Membre'}
                </div>
              </li>
            ))}
          </ul>
        )}
        {members.some(m => m.user_id === currentUserId && m.role === 'Owner') && (
          <div className="household-invite-row">
            <button className="household-invite-member">
              Inviter un membre de votre foyer
            </button>
          </div>
        )}
      </div>
      <div className="households-card">
        <h1 className="households-setting">Paramètres du foyer</h1>
        {members.length === 0 && !loading && !error && (
          <div className="households-empty">Aucun membre trouvé.</div>
        )}
        <h2 className="households-members-title">Membres du foyer</h2>
        {members.length > 0 && (
          <ul className="household-list">
            {members.map((m) => (
              <li key={m.user_id} className="household-item">
                <div className="household-item-name">
                  {(m.name || m.last_name) ? `${m.name ?? ''} ${m.last_name ?? ''}`.trim() : m.email || m.user_id}
                </div>
                <div className="household-item-meta">
                  {m.role === 'Owner' ? 'Propriétaire' : 'Membre'}
                </div>
              </li>
            ))}
          </ul>
        )}
        {members.some(m => m.user_id === currentUserId && m.role === 'Owner') && (
          <div className="household-quit-row">
            <button className="household-quit-button">
              Quitter le foyer
            </button>
          </div>
        )}
      </div>

      {loading && <div className="households-loading">Chargement…</div>}
      {error && <div className="households-error">{error}</div>}
    </main>
  );
}
