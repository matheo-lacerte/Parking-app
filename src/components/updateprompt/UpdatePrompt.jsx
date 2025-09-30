import { useState, useEffect } from "react";
import { registerSW } from "virtual:pwa-register";

export default function UpdatePrompt() {
  const [show, setShow] = useState(false);
  const [update, setUpdate] = useState(null);

  // Détection iOS Safari
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        // Une nouvelle version est prête → rendre la mise à jour obligatoire
        setUpdate(() => updateSW);
        setShow(true);

        // Sur Android/desktop, déclencher l'update automatiquement
        if (!isIOS) {
          // Petit délai pour permettre au rendu de l'overlay
          setTimeout(() => updateSW(true), 100);
        }
      },
      onOfflineReady() {
        console.log("✅ App prête en mode offline");
      }
    });
  }, [isIOS]);

  if (!show) return null;

  // Styles overlay bloquant
  const overlay = {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(2px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
  };

  const card = {
    background: "#2c3e50",
    color: "#fff",
    padding: "24px",
    borderRadius: "16px",
    width: "min(480px, 90vw)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.15)",
  };

  const title = {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  };

  const desc = {
    margin: 0,
    opacity: 0.9,
    lineHeight: 1.5,
    fontSize: 14,
  };

  const btn = {
    marginTop: 16,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#61dafb",
    color: "#0b1b22",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  };

  const spinner = {
    width: 18,
    height: 18,
    border: "2px solid rgba(255,255,255,0.35)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };

  return (
    <div style={overlay}>
      <div style={card}>
        <h3 style={title}>Mise à jour requise</h3>
        {isIOS ? (
          <p style={desc}>
            Une nouvelle version est disponible. Pour continuer à utiliser l'application,
            vous devez la relancer. Fermez l'application (ou l'onglet Safari) puis rouvrez-la.
          </p>
        ) : (
          <p style={desc}>
            Une nouvelle version est en cours d'installation. L'application va se
            recharger automatiquement dans un instant.
          </p>
        )}

        {isIOS ? (
          <button style={btn} onClick={() => window.location.reload()}>
            Recharger maintenant
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
            <div style={spinner} />
            <button style={btn} onClick={() => update?.(true)}>
              Réessayer la mise à jour
            </button>
          </div>
        )}
      </div>

      {/* petite animation CSS inline */}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
