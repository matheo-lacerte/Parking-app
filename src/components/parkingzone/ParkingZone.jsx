import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ParkingZone.css";

export default function ParkingMap({ onSelect, photo }) {
  const navigate = useNavigate();
  const location = useLocation();

  const zones = useMemo(
    () => [
      { name: "Zone A", img: "/zoneA.png" },
      { name: "Zone B", img: "/zoneB.png" },
      { name: "Zone C", img: "/zoneC.png" },
      { name: "Zone D", img: "/zoneD.png" },
    ],
    []
  );

  const [selected, setSelected] = useState(null);

  // Photo résolue: props > navigation state > sessionStorage
  let resolvedPhoto = photo;
  if (!resolvedPhoto) {
    const fromNav = location.state?.photo;
    if (fromNav) resolvedPhoto = fromNav;
  }
  if (!resolvedPhoto) {
    try {
      const fromSession = sessionStorage.getItem("pc:lastPhoto");
      if (fromSession) resolvedPhoto = fromSession;
    } catch {}
  }

  const choose = (zoneName) => {
    setSelected(zoneName);
    onSelect?.(zoneName);

    // Charger l'historique existant
    const existing = JSON.parse(localStorage.getItem("reports") || "[]");

    // Créer un nouvel enregistrement
    const newEntry = {
      id: Date.now(),
      zone: zoneName,
      photo: resolvedPhoto || null, // photo capturée (prop, state ou session)
      date: new Date().toISOString(),
    };

    // Sauvegarder dans localStorage
    const updated = [...existing, newEntry];
    try {
      localStorage.setItem("reports", JSON.stringify(updated));
    } catch (e) {
      // Si la taille dépasse le quota, on sauvegarde sans la photo
      try {
        const fallback = [...existing, { ...newEntry, photo: null, note: "photo omise: quota" }];
        localStorage.setItem("reports", JSON.stringify(fallback));
      } catch {}
    }

    // Nettoyer la photo temporaire de session
    try { sessionStorage.removeItem("pc:lastPhoto"); } catch {}

    // Aller vers la page success
    navigate("/success", { state: { zone: zoneName } });
  };

  return (
    <div className="map-screen">
      <div className="zone-grid">
        {zones.map((z) => (
          <button
            key={z.name}
            className={`zone-tile${selected === z.name ? " selected" : ""}`}
            onClick={() => choose(z.name)}
            aria-label={`Sélectionner ${z.name}`}
          >
            {z.img ? (
              <img
                className="zone-tile-img"
                src={z.img}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ) : null}
            <span className="zone-tile-label">{z.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
