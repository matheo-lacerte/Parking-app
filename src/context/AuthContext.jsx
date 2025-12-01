import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!token;

  const login = useCallback((newToken) => {
    if (!newToken) return;
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setToken(null);
  }, []);

  // Optional: future place to validate token with backend
  useEffect(() => {
    // Could add silent refresh or token verification here
  }, [token]);

  const value = { token, isAuthenticated, login, logout, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
