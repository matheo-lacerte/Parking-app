import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiFetch } from '../../lib/api.js';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token, logout } = useAuth();
  const location = useLocation();

  // Helper: check JWT `exp` claim (in seconds since epoch)
  const isTokenExpired = (jwt) => {
    if (!jwt) return true;
    const parts = jwt.split('.');
    if (parts.length !== 3) return false; // non-JWT tokens: treat as unknown, don't block
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = JSON.parse(atob(base64));
      if (!json.exp) return false;
      const nowInSeconds = Math.floor(Date.now() / 1000);
      return nowInSeconds >= json.exp;
    } catch (_) {
      return false;
    }
  };

  // Helper: get household_id from JWT (if present)
  const getHouseholdId = (jwt) => {
    if (!jwt) return null;
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload.household_id ?? null;
    } catch (_) {
      return null;
    }
  };

  // If authenticated but token expired, force logout and redirect to login
  if (isAuthenticated && isTokenExpired(token)) {
    logout();
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, reason: 'token_expired' }}
      />
    );
  }

  // If not authenticated at all, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Always verify household via profile to avoid stale/missing JWT claims
  const householdIdClaim = getHouseholdId(token);
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasHousehold, setHasHousehold] = useState(!!householdIdClaim);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Always fetch profile to get current household state
      try {
        const res = await apiFetch('/auth/getProfile', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            const hid = data?.user?.household_id ?? null;
            setHasHousehold(!!hid);
          }
          setProfileChecked(true);
        }
      } catch (_) {
        if (!cancelled) setProfileChecked(true);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [token]);

  if (!profileChecked) {
    // Optionally show a tiny placeholder to avoid flicker
    return null;
  }

  if (!hasHousehold) {
    if (location.pathname !== '/household/waiting') {
      return (
        <Navigate
          to="/household/waiting"
          replace
          state={{ from: location.pathname, reason: 'no_household' }}
        />
      );
    }
    // Allow access to the waiting page when no household
    return children;
  }

  return children;
};

export default ProtectedRoute;
