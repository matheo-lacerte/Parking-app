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
        <span className="navbar-title">Parking Copro</span>
      </div>

      <div className="navbar-links">
        <a href="/" className="navbar-link active">Accueil</a>
        <a href="/profile" className="navbar-link">Profile</a>
      </div>
    </nav>
  );
}
