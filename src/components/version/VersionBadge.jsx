import React from "react";
import "./VersionBadge.css";

// We prefer injecting the version at build time from package.json via import.meta.env
// Fallback to Vite's package.json import if needed later.
const VERSION = import.meta.env.VITE_APP_VERSION || "v?";

export default function VersionBadge() {
  return (
    <div className="version-badge" aria-label={`Version ${VERSION}`}>
      {VERSION}
    </div>
  );
}
