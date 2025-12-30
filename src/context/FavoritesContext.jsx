import React, { createContext, useContext, useEffect, useState } from "react";

const FavoritesContext = createContext(null);

const STORAGE_KEY = "auralyn:favorites";

export const FavoritesProvider = ({ children }) => {
  /* ===========================
     INITIAL STATE (CRITICAL FIX)
     =========================== */
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error("Failed to initialize favorites from storage", err);
    }
    return [];
  });

  /* ===========================
     Load favorites on startup
     (kept for safety / sync)
     =========================== */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to load favorites from storage", err);
    }
  }, []);

  /* ===========================
     Persist favorites on change
     =========================== */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (err) {
      console.error("Failed to save favorites to storage", err);
    }
  }, [favorites]);

  /* ===========================
     Helpers
     =========================== */

  const isFavorite = (songId) => {
    return favorites.some((s) => s.id === songId);
  };

  const addFavorite = (song) => {
    setFavorites((prev) => {
      if (prev.some((s) => s.id === song.id)) {
        return prev;
      }
      return [...prev, song];
    });
  };

  const removeFavorite = (songId) => {
    setFavorites((prev) => prev.filter((s) => s.id !== songId));
  };

  const toggleFavorite = (song) => {
    setFavorites((prev) => {
      const exists = prev.some((s) => s.id === song.id);
      if (exists) {
        return prev.filter((s) => s.id !== song.id);
      }
      return [...prev, song];
    });
  };

  /* ===========================
     Exposed API
     =========================== */
  const value = {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    totalFavorites: favorites.length,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

/* ===========================
   Hook
   =========================== */
export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used inside FavoritesProvider");
  }
  return ctx;
};
