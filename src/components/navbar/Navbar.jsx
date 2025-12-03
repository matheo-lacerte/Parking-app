import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Navbar.css";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

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


        {isAuthenticated ? (
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
