import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  // We keep a counter so multiple concurrent loads show one overlay
  const counterRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);

  // Stable callbacks (do not depend on isLoading) to avoid effect loops
  const startLoading = useCallback(() => {
    counterRef.current += 1;
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    counterRef.current = Math.max(0, counterRef.current - 1);
    if (counterRef.current === 0) setIsLoading(false);
  }, []);

  const wrapPromise = useCallback(async (promiseFn) => {
    startLoading();
    try {
      return await promiseFn();
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading, wrapPromise }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
};