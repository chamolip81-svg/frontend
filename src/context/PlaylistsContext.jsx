import React, { createContext, useContext, useEffect, useState } from "react";

const PlaylistsContext = createContext(null);

const STORAGE_KEY = "auralyn:playlists";

export const PlaylistsProvider = ({ children }) => {
  const [playlists, setPlaylists] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error("Failed to load playlists", err);
    }
    return [];
  });

  /* Persist playlists */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
    } catch (err) {
      console.error("Failed to save playlists", err);
    }
  }, [playlists]);

  /* =====================
     Playlist operations
     ===================== */

  const createPlaylist = (name) => {
    const newPlaylist = {
      id: `playlist-${Date.now()}`,
      name,
      createdAt: Date.now(),
      songs: [],
    };
    setPlaylists((prev) => [...prev, newPlaylist]);
  };

  const deletePlaylist = (playlistId) => {
    setPlaylists((prev) => prev.filter(p => p.id !== playlistId));
  };

  const addSongToPlaylist = (playlistId, song) => {
    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id !== playlistId) return playlist;

        const exists = playlist.songs.some(s => s.id === song.id);
        if (exists) return playlist;

        return {
          ...playlist,
          songs: [...playlist.songs, song],
        };
      })
    );
  };

  const removeSongFromPlaylist = (playlistId, songId) => {
    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id !== playlistId) return playlist;
        return {
          ...playlist,
          songs: playlist.songs.filter(s => s.id !== songId),
        };
      })
    );
  };

  const value = {
    playlists,
    createPlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
  };

  return (
    <PlaylistsContext.Provider value={value}>
      {children}
    </PlaylistsContext.Provider>
  );
};

export const usePlaylists = () => {
  const ctx = useContext(PlaylistsContext);
  if (!ctx) {
    throw new Error("usePlaylists must be used inside PlaylistsProvider");
  }
  return ctx;
};
