import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import UpdatePrompt from "./components/updateprompt/UpdatePrompt";
import VersionBadge from "./components/version/VersionBadge";
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <Outlet />
      <UpdatePrompt />
      <VersionBadge />
    </div>
  );
}

export default App;
