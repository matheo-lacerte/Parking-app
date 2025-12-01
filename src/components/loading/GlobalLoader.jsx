import React from 'react';
import './GlobalLoader.css';
import { useLoading } from '../../context/LoadingContext.jsx';

const GlobalLoader = () => {
  const { isLoading } = useLoading();
  return isLoading ? (
    <div className="global-loader-overlay" role="status" aria-live="polite">
      <div className="global-loader-spinner">
        <div className="gl-dot" />
        <div className="gl-dot" />
        <div className="gl-dot" />
      </div>
      <div className="global-loader-text">Chargement…</div>
    </div>
  ) : null;
};

export default GlobalLoader;