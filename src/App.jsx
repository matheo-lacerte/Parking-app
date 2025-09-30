import React from "react";
import Navbar from "./components/Navbar";
import './App.css';

function App() {
  const handleCameraClick = () => {
    console.log("Caméra cliquée !");
    // Ici vous pouvez ajouter la logique pour ouvrir la caméra
  };

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <div className="camera-container" onClick={handleCameraClick}>
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
      </main>
    </div>
  );
}

export default App;
