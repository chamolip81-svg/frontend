/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search as SearchIcon,
  AlertCircle,
  TrendingUp,
  Clock,
  X,
  Music
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import SongCard from '../components/SongCard';
import {
  performPreviewSearch,
  performFullSearch,
  getRecoveryResults,
  getSearchHistory,
  clearSearchHistory,
} from '../services/searchService';

const Search = () => {
  /* ===========================
     CORE STATE
  =========================== */
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    songs: [],
    artists: [],
    albums: [],
  });
  const [mode, setMode] = useState('idle');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  /* ===========================
     REFS
  =========================== */
  const debounceRef = useRef(null);
  const observerRef = useRef(null);
  const queryRef = useRef('');

  /* ===========================
     INIT
  =========================== */
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  /* ===========================
     PREVIEW SEARCH
  =========================== */
  const handlePreviewSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setMode('idle');
      setResults({ songs: [], artists: [], albums: [] });
      setError(null);
      return;
    }

    queryRef.current = searchQuery;

    try {
      setError(null);
      const previewResults = await performPreviewSearch(searchQuery);

      if (previewResults.mode === 'error') {
        setError(previewResults.error.message || 'Search failed');
        setMode('error');
        return;
      }

      setResults(previewResults);
      setMode('preview');
    } catch (err) {
      setError(err.message);
      setMode('error');
    }
  };

  /* ===========================
     INPUT CHANGE
  =========================== */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value && value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        handlePreviewSearch(value);
      }, 300);
    } else {
      setMode('idle');
      setResults({ songs: [], artists: [], albums: [] });
      setShowSearchHistory(true);
    }
  };

  /* ===========================
     FULL SEARCH
  =========================== */
  const handleFullSearch = async (e) => {
    if (e?.key && e.key !== 'Enter') return;

    const searchQuery = e?.target?.value || query;
    if (!searchQuery || searchQuery.trim().length < 2) return;

    setIsLoading(true);
    setShowSearchHistory(false);
    setError(null);
    setPage(0);

    try {
      const fullResults = await performFullSearch(searchQuery, 0);

      if (fullResults.mode === 'no-results') {
        const recovery = await getRecoveryResults(searchQuery);
        setResults({ ...recovery, originalQuery: searchQuery });
        setMode('recovery');
      } else {
        setResults(fullResults);
        setMode('full');
        setHasMore(true);
      }
    } catch (err) {
      setError(err.message);
      setMode('error');
    } finally {
      setIsLoading(false);
    }
  };

  /* ===========================
     PAGINATION (ESLINT SAFE)
  =========================== */
  const handleLoadMore = useCallback(async () => {
    if (mode !== 'full' || isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const nextPage = page + 1;
      const moreResults = await performFullSearch(query, nextPage);

      if (moreResults.songs.length === 0) {
        setHasMore(false);
      } else {
        setResults({
          ...moreResults,
          songs: [...results.songs, ...moreResults.songs],
        });
        setPage(nextPage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    mode,
    isLoading,
    hasMore,
    page,
    query,
    results.songs,
  ]);

  /* ===========================
     OBSERVER
  =========================== */
  useEffect(() => {
    const target = observerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && mode === 'full' && hasMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [mode, hasMore, handleLoadMore]);

  /* ===========================
     RENDER HELPERS
  =========================== */
  const renderSongsGrid = (songs) => (
    <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4">
      {songs.map((song) => (
        <SongCard key={song.id} song={song} />
      ))}
    </div>
  );

  return (
    <div className="p-6 pb-32">
      {/* Search Bar */}
      <div className="mb-8 sticky top-0 bg-gray-900 py-4 z-40">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleFullSearch}
            placeholder="Search songs, artists, albums..."
            className="w-full bg-gray-800 text-white rounded-full py-3 pl-12 pr-10 focus:ring-2 focus:ring-green-500"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setMode('idle');
                setResults({ songs: [], artists: [], albums: [] });
              }}
              className="absolute right-4 top-3.5 text-gray-400"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {mode === 'preview' && results.songs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Songs</h3>
          {renderSongsGrid(results.songs)}
        </div>
      )}

      {mode === 'full' && results.songs.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Music size={20} /> Songs
          </h3>
          {renderSongsGrid(results.songs)}
        </div>
      )}

      <div ref={observerRef} className="mt-8" />
    </div>
  );
};

export default Search;
