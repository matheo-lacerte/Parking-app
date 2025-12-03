import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiFetch } from "../../lib/api.js";
import "./Navbar.css";

export default function Navbar() {
  const { isAuthenticated, token, logout } = useAuth();
  const [hasHousehold, setHasHousehold] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isAuthenticated || !token) {
        setHasHousehold(false);
        return;
      }
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
          } else {
            setHasHousehold(false);
          }
        }
      } catch (_) {
        if (!cancelled) setHasHousehold(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [isAuthenticated, token]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img
          src="/IconParking-192.png"
          alt="Logo Parking Copro"
          className="navbar-logo"
        />
        <span className="navbar-title">
          <span className="navbar-title-line">Parking</span>
          <span className="navbar-title-line">Copro</span>
        </span>
      </div>
      <div className="navbar-links">
        {isAuthenticated && hasHousehold ? (
          <>
            <NavLink to="/" end className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Accueil</NavLink>
            <NavLink to="/profil" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Profil</NavLink>
            <NavLink to="/households" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Occupant</NavLink>
          </>
        ) : (
          null
        )}
      </div>
    </nav>
  );
}
