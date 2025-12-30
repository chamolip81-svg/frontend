// src/context/OfflineContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getAllOfflineSongs,
  saveSongOffline,
  removeOfflineSong,
  isSongOffline,
} from "../utils/offlineStorage";

const OfflineContext = createContext(null);

export const OfflineProvider = ({ children }) => {
  const [offlineSongs, setOfflineSongs] = useState([]);
  const [isReady, setIsReady] = useState(false);

  /* ============================
     Load offline songs on start
     ============================ */
  useEffect(() => {
    async function load() {
      try {
        const stored = await getAllOfflineSongs();
        setOfflineSongs(stored || []);
      } catch (err) {
        console.error("Failed to load offline songs", err);
      } finally {
        setIsReady(true);
      }
    }

    load();
  }, []);

  /* ============================
     Helpers
     ============================ */

  const isDownloaded = (songId) => {
    return offlineSongs.some((s) => s.id === songId);
  };

  const addOfflineSong = async (song, audioBlob) => {
    await saveSongOffline(song, audioBlob);

    setOfflineSongs((prev) => {
      if (prev.some((s) => s.id === song.id)) return prev;
      return [
        ...prev,
        {
          id: song.id,
          song,
          audioBlob,
        },
      ];
    });
  };

  const removeOffline = async (songId) => {
    await removeOfflineSong(songId);

    setOfflineSongs((prev) => prev.filter((s) => s.id !== songId));
  };

  const value = {
    offlineSongs,
    isDownloaded,
    addOfflineSong,
    removeOffline,
    isReady,
    totalOffline: offlineSongs.length,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

/* ============================
   Hook
   ============================ */
export const useOffline = () => {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error("useOffline must be used inside OfflineProvider");
  }
  return ctx;
};
