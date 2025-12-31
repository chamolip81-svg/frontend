// src/services/searchService.js
// ========================================
// COMPLETE SEARCH INTELLIGENCE SERVICE
// ========================================

import { searchSongs } from "./api";
import { getTrending } from "./trending";

const SEARCH_MEMORY_KEY = "auralyn:search-history";
const MAX_SEARCH_HISTORY = 5;

/* ===========================
   NORMALIZATION LOGIC
   =========================== */
const normalizeString = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[_\-\s]+/g, " ") // normalize spaces and dashes
    .replace(/[^\w\s]/g, ""); // remove special chars
};

/* ===========================
   RELEVANCE SCORING (AI-LIKE)
   =========================== */
const calculateRelevance = (song, query) => {
  const normalizedQuery = normalizeString(query);
  const normalizedName = normalizeString(song.name);
  const normalizedArtist = normalizeString(song.artist || "");
  const normalizedAlbum = normalizeString(song.album || "");

  let score = 0;

  // Exact match (highest priority)
  if (normalizedName === normalizedQuery) {
    score += 10;
  }
  // Song name starts with query (very strong)
  else if (normalizedName.startsWith(normalizedQuery)) {
    score += 5;
  }
  // Song name contains query
  else if (normalizedName.includes(normalizedQuery)) {
    score += 3;
  }

  // Artist exact match
  if (normalizedArtist === normalizedQuery) {
    score += 8;
  }
  // Artist starts with query
  else if (normalizedArtist.startsWith(normalizedQuery)) {
    score += 3;
  }
  // Artist contains query
  else if (normalizedArtist.includes(normalizedQuery)) {
    score += 2;
  }

  // Album match (lower priority)
  if (normalizedAlbum.includes(normalizedQuery)) {
    score += 1;
  }

  return score;
};

/* ===========================
   RANK RESULTS LOCALLY
   =========================== */
const rankResults = (songs, query) => {
  return songs
    .map((song) => ({
      ...song,
      relevanceScore: calculateRelevance(song, query),
    }))
    .filter((song) => song.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map((song) => {
      const { relevanceScore, ...rest } = song;
      return rest;
    });
};

/* ===========================
   DERIVE ARTISTS FROM SONGS
   =========================== */
const deriveArtists = (songs, limit = 5) => {
  const artistMap = new Map();

  songs.forEach((song) => {
    const artist = song.artist || "Unknown Artist";
    if (!artistMap.has(artist)) {
      artistMap.set(artist, {
        name: artist,
        songCount: 0,
      });
    }
    artistMap.get(artist).songCount += 1;
  });

  return Array.from(artistMap.values())
    .sort((a, b) => b.songCount - a.songCount)
    .slice(0, limit)
    .map((artist) => ({
      id: `artist-${artist.name}`,
      name: artist.name,
      type: "artist",
      songCount: artist.songCount,
    }));
};

/* ===========================
   DERIVE ALBUMS FROM SONGS
   =========================== */
const deriveAlbums = (songs, limit = 5) => {
  const albumMap = new Map();

  songs.forEach((song) => {
    const album = song.album || "Single";
    if (!albumMap.has(album)) {
      albumMap.set(album, {
        name: album,
        songs: [],
        image: song.image,
      });
    }
    albumMap.get(album).songs.push(song);
  });

  return Array.from(albumMap.values())
    .sort((a, b) => b.songs.length - a.songs.length)
    .slice(0, limit)
    .map((album) => ({
      id: `album-${album.name}`,
      name: album.name,
      type: "album",
      songCount: album.songs.length,
      image: album.image,
    }));
};

/* ===========================
   SEARCH MEMORY (LOCAL)
   =========================== */
export const getSearchHistory = () => {
  try {
    const stored = localStorage.getItem(SEARCH_MEMORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveSearchToHistory = (query) => {
  if (!query || query.trim().length < 2) return;

  try {
    const history = getSearchHistory();
    const cleaned = query.trim().toLowerCase();

    // Remove duplicate if exists
    const filtered = history.filter(
      (item) => item.toLowerCase() !== cleaned
    );

    // Add to front, limit to 5
    const updated = [query, ...filtered].slice(0, MAX_SEARCH_HISTORY);

    localStorage.setItem(SEARCH_MEMORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save search history", err);
  }
};

export const clearSearchHistory = () => {
  try {
    localStorage.removeItem(SEARCH_MEMORY_KEY);
  } catch (err) {
    console.error("Failed to clear search history", err);
  }
};

/* ===========================
   MAIN SEARCH LOGIC
   (Two modes: Preview & Full)
   =========================== */

export const performPreviewSearch = async (query) => {
  if (!query || query.trim().length < 2) {
    return { songs: [], artists: [], albums: [], mode: "empty" };
  }

  try {
    console.log(`🔍 Preview Search: "${query}"`);

    // Fetch from backend (page 0, minimal)
    const { songs } = await searchSongs(query, 0);

    // Rank locally
    const ranked = rankResults(songs || [], query);

    // Derive artists and albums
    const artists = deriveArtists(ranked, 3); // Fewer in preview
    const albums = deriveAlbums(ranked, 3);

    return {
      songs: ranked.slice(0, 6), // Limited preview
      artists,
      albums,
      mode: "preview",
      totalBackend: songs?.length || 0,
    };
  } catch (err) {
    console.error("Preview search failed:", err);
    return { songs: [], artists: [], albums: [], mode: "error", error: err };
  }
};

export const performFullSearch = async (query, page = 0) => {
  if (!query || query.trim().length < 2) {
    return { songs: [], artists: [], albums: [], mode: "empty" };
  }

  try {
    console.log(`📊 Full Search: "${query}" (page ${page})`);

    // Save to history (only on full search)
    saveSearchToHistory(query);

    // Fetch from backend
    const { songs, total } = await searchSongs(query, page);

    if (!songs || songs.length === 0) {
      console.warn(`⚠️ Zero results for: "${query}"`);
      return {
        songs: [],
        artists: [],
        albums: [],
        mode: "no-results",
        query,
        total: 0,
      };
    }

    // Rank locally
    const ranked = rankResults(songs, query);

    // Derive artists and albums
    const artists = deriveArtists(ranked, 5); // Full list
    const albums = deriveAlbums(ranked, 5);

    return {
      songs: ranked,
      artists,
      albums,
      mode: "full",
      total,
      page,
      query,
    };
  } catch (err) {
    console.error("Full search failed:", err);
    return {
      songs: [],
      artists: [],
      albums: [],
      mode: "error",
      error: err,
      query,
    };
  }
};

/* ===========================
   RECOVERY MODE (NEVER EMPTY)
   =========================== */
export const getRecoveryResults = async (failedQuery) => {
  try {
    console.log(`🆘 Recovery Mode for: "${failedQuery}"`);

    const trending = await getTrending("global");
    const recent = getSearchHistory();

    return {
      mode: "recovery",
      trending: trending.slice(0, 12),
      recentSearches: recent,
      failedQuery,
      message: `No results for "${failedQuery}" — here are trending songs`,
    };
  } catch (err) {
    console.error("Recovery mode failed:", err);
    return {
      mode: "recovery-error",
      trending: [],
      recentSearches: [],
      message: "Try a different search",
    };
  }
};

/* ===========================
   EXPORT ALL
   =========================== */
export default {
  performPreviewSearch,
  performFullSearch,
  getRecoveryResults,
  getSearchHistory,
  saveSearchToHistory,
  clearSearchHistory,
};