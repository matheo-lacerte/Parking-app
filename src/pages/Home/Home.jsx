import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const handleCameraClick = () => {
    console.log("Caméra cliquée !");
  };

  const navigateToCamera = () => {
    window.location.href = "/camera";
  };

  return (
    <main className="main-content">
      <div className="home-screen">
        <div className="camera-container" onClick={navigateToCamera}>
          <div className="camera-box">
            <div className="camera-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="white" viewBox="0 0 24 24">
                <path d="M12 9a3 3 0 100 6 3 3 0 000-6zm7-3h-2.586l-1.707-1.707A.996.996 0 0014 4h-4c-.265 0-.52.105-.707.293L7.586 6H5c-1.103 0-2 .897-2 2v10c0 
 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V8c0-1.103-.897-2-2-2zM12 17c-2.757 
 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z"/>
              </svg>
            </div>
          </div>
          <div className="camera-text">
            Cliquez pour ajouter et vérifier une voiture
          </div>
        </div>
        <div className="home-actions">
          <div className="home-history-small">
            Signalement récents
            <li>

            </li>
          </div>
        </div>

        <div className="home-actions">
          <Link to="/history" className="home-history-btn">
            <svg className="home-history-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12a9 9 0 1 1-9-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Afficher plus
          </Link>
        </div>
      </div>
    </main>
  );
}
