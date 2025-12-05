import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLoading } from "../../context/LoadingContext.jsx";
import { apiFetch } from "../../lib/api.js";
import './houseHolds.css';
import InviteModal from "../../components/household/InviteModal.jsx";

export default function Home() {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
    const handleLeaving = React.useCallback(async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await apiFetch('/household/quit', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({}),
        });
  
        if (!res.ok) {
          const text = await res.text();
          console.error('Household quit failed:', res.status, text);
          alert('Household quit failed');
          return;
        }
  
        localStorage.removeItem('authToken');
        console.log('Left household via server');
        window.location.href = '/household/waiting';
      } catch (err) {
        console.error('Household quit error:', err);
        alert('Network error during household quit');
      }
    }, []);

  const { wrapPromise } = useLoading();
  const [inviteOpen, setInviteOpen] = useState(false);

  const handleOpenInvite = () => setInviteOpen(true);
  const handleCloseInvite = () => setInviteOpen(false);

  const submitInvite = async (email) => {
    const res = await apiFetch('/household/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Échec de l\'invitation');
    }
    // Optionally refresh members list
    wrapPromise(async () => {
      try {
        const mRes = await apiFetch('/household/members', {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        const mData = mRes.ok ? await mRes.json() : [];
        setMembers(Array.isArray(mData) ? mData : []);
      } catch {}
    });
  };

  const removeMember = async (member) => {
    try {
      const endpoint = member.status === 'pending' ? '/household/cancel' : '/household/remove';
      const res = await apiFetch(endpoint, {
        method: member.status === 'pending' ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ householdId: address?.id, userId: member.user_id, email: member.email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Échec de la suppression du membre');
      }
      const mRes = await apiFetch('/household/members', {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const mData = mRes.ok ? await mRes.json() : [];
      setMembers(Array.isArray(mData) ? mData : []);
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    if (!token) return;
    // Accept invite from email link: ?accept=1&householdId=...&email=...
    const url = new URL(window.location.href);
    const accept = url.searchParams.get('accept');
    const inviteToken = url.searchParams.get('invite');
    if (accept === '1' && inviteToken) {
      wrapPromise(async () => {
        try {
          const res = await apiFetch('/household/accept', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ invite: inviteToken }),
          });
          if (res.ok) {
            // Clean query params and refresh members/address
            const cleanUrl = `${url.pathname}`;
            window.history.replaceState({}, '', cleanUrl);
            // After successful acceptance, navigate home for clearer UX
            try { window.location.assign('/'); } catch {}
            const mRes = await apiFetch('/household/members', {
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            const mData = mRes.ok ? await mRes.json() : [];
            setMembers(Array.isArray(mData) ? mData : []);
            const aRes = await apiFetch('/household/address', {
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            const aData = aRes.ok ? await aRes.json() : null;
            setAddress(Array.isArray(aData) ? (aData[0] ?? null) : (aData ?? null));
          } else {
            const data = await res.json().catch(() => ({}));
            setError(data.error || 'Échec lors de l\'acceptation de l\'invitation');
          }
        } catch (e) {
          setError(e.message);
        }
      });
    }
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
        // API returns an array of households; pick the first row
        setAddress(Array.isArray(data) ? (data[0] ?? null) : (data ?? null));
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
        <h1 className="households-name">Foyer {address?.address ?? ''}</h1>
        {members.length === 0 && !loading && !error && (
          <div className="households-empty">Aucun membre trouvé.</div>
        )}
        <h2 className="households-members-title">Membres du foyer</h2>
        {members.length > 0 && (
          <ul className="household-list">
            {members.map((m) => {
              const isPending = m.status === 'pending'
              const isOwner = m.role === 'Owner'
              const currentIsOwner = members.some(x => x.user_id === currentUserId && x.role === 'Owner')
              return (
                <li key={m.user_id || m.email} className={`household-item`}>
                  <div className="household-item-name">
                    {(m.name || m.last_name) ? `${m.name ?? ''} ${m.last_name ?? ''}`.trim() : (m.email || m.user_id)}
                  </div>
                  <div className="household-item-meta">
                    {isOwner && (
                      <span className="role-badge owner">Propriétaire</span>
                    )}
                    {m.role === 'member' && (
                      <span className="role-badge member">Membre</span>
                    )}
                    {isPending && (
                      <span className="invite-badge">Invité (en attente)</span>
                    )}
                    {currentIsOwner && m.user_id !== currentUserId && (
                      <div className="household-actions">
                        {isPending ? (
                          <button
                            className="household-cancel-invite badge-button"
                            onClick={() => removeMember(m)}
                          >
                            Annuler l'invitation
                          </button>
                        ) : (
                          <button
                            className="kick-button"
                            title="Retirer du foyer"
                            onClick={() => removeMember(m)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {members.some(m => m.user_id === currentUserId && m.role === 'Owner') && (
          <div className="household-invite-row">
            <button className="household-invite-member" onClick={handleOpenInvite}>
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
        {members.length > 0 && (
          <ul className="household-list">
              <li className="household-item">
                <div className="settings-label">Adresse</div>
                <div className="settings-value">{address?.address || 'Non définie'}</div>
              </li>
              <li className="household-item">
                <div className="settings-label">Créé le</div>
                <div className="settings-value">{address?.created_at ? new Date(address.created_at).toLocaleDateString() : 'Inconnue'}</div>
              </li>
              <li className="household-item">
                <div className="settings-label">Membres</div>
                <div className="settings-value">{members.length}</div>
              </li>
          </ul>
        )}

          <div className="household-quit-row">
            <button className="household-quit-button" onClick={handleLeaving}>
              Quitter le foyer
            </button>
          </div>

      </div>

      {loading && <div className="households-loading">Chargement…</div>}
      {error && <div className="households-error">{error}</div>}

      <InviteModal open={inviteOpen} onClose={handleCloseInvite} onSubmit={submitInvite} />
    </main>
  );
}
