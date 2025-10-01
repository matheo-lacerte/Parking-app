import { useLocation, useNavigate } from "react-router-dom";

export default function Success() {
  const location = useLocation();
  const navigate = useNavigate();
  const zone = location.state?.zone;

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>✅ Enregistré avec succès</h2>
      <p>La voiture a été enregistrée dans <b>{zone}</b>.</p>
      <button onClick={() => navigate("/")}>Retour à l’accueil</button>
    </div>
  );
}
