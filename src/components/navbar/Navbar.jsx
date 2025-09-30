import React from "react";
import "./Navbar.css";

export default function Navbar() {
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
        <a href="/" className="navbar-link active">Accueil</a>
        <a href="/profil" className="navbar-link">Profil</a>
      </div>
    </nav>
  );
}
