import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLoading } from "../../context/LoadingContext.jsx";

export default function Home() {
  const { token } = useAuth();
  const [observations, setObservations] = useState([]);
  const [loadingObs, setLoadingObs] = useState(false);
  const [errorObs, setErrorObs] = useState(null);
  const handleCameraClick = () => {
    console.log("Caméra cliquée !");
  };

  const navigateToCamera = () => {
    window.location.href = "/camera";
  };

  const { wrapPromise } = useLoading();

  useEffect(() => {
    // Avoid effect loop: do not include wrapPromise in deps
    wrapPromise(async () => {
      try {
        setLoadingObs(true);
        setErrorObs(null);
        const res = await fetch("http://localhost:4000/observations/byDate", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Erreur de récupération des observations");
        }
        const list = await res.json();
        setObservations(Array.isArray(list) ? list.slice(0, 5) : []);
      } catch (e) {
        setErrorObs(e.message);
      } finally {
        setLoadingObs(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
        <div>
          <section className="home-observations">
            <div className="home-obs-header">
              <h3 className="home-obs-title">Dernières observations</h3>
              <Link to="/history" className="home-obs-viewall">Tout voir</Link>
            </div>

            {loadingObs && <div className="home-obs-status">Chargement…</div>}
            {errorObs && <div className="home-obs-error">{errorObs}</div>}

            {!loadingObs && !errorObs && (
              <ul className="home-obs-list">
                {observations.length === 0 && (
                  <li className="home-obs-empty">Aucune observation pour le moment.</li>
                )}
                {observations.map((obs) => (
                  <li key={obs.id} className="home-obs-item">
                    <div className="home-obs-main">
                      <span className="home-obs-plate">{obs.license_plate || "Plaque inconnue"}</span>
                      <span className="home-obs-zone">{obs.zone || "Zone inconnue"}</span>
                    </div>
                    <div className="home-obs-meta">
                      <span className="home-obs-time">{new Date(obs.created_at).toLocaleString()}</span>
                      {obs.status && <span className={`home-obs-statuspill status-${obs.status}`}>{obs.status}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
