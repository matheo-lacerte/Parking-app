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
        setShow(true);
        setUpdate(() => updateSW);
      },
      onOfflineReady() {
        console.log("✅ App prête en mode offline");
      }
    });
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#2c3e50",
      color: "white",
      padding: "12px 20px",
      borderRadius: "8px",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      zIndex: 9999
    }}>
      <span>
        {isIOS
          ? "Nouvelle version dispo 🚀 Fermez/réouvrez ou cliquez pour recharger."
          : "Nouvelle version disponible 🚀"}
      </span>

      <button
        style={{
          background: "#61dafb",
          border: "none",
          borderRadius: "4px",
          padding: "6px 12px",
          cursor: "pointer",
          fontWeight: "bold"
        }}
        onClick={() => {
          if (isIOS) {
            // iOS ne remplace pas le SW immédiatement → juste reload
            window.location.reload();
          } else {
            // Android & co → update direct via SW
            update(true);
          }
        }}
      >
        Mettre à jour
      </button>
    </div>
  );
}
