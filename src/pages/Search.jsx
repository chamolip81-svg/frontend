// src/pages/Search.jsx
import React, { useState, useRef, useEffect } from 'react';
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
  const [mode, setMode] = useState('idle'); // idle, preview, full, no-results, recovery, error
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
     INIT & CLEANUP
     =========================== */
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  /* ===========================
     DEBOUNCED PREVIEW SEARCH
     (Runs on every keystroke, but debounced)
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
      console.log('✨ Preview loaded');
    } catch (err) {
      console.error('Preview search error:', err);
      setError(err.message);
      setMode('error');
    }
  };

  /* ===========================
     INPUT CHANGE (WITH DEBOUNCE)
     =========================== */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear old debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Only trigger preview for valid input
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
     FULL SEARCH (ENTER KEY)
     =========================== */
  const handleFullSearch = async (e) => {
    if (e?.key && e.key !== 'Enter') return;

    const searchQuery = e?.target?.value || query;

    if (!searchQuery || searchQuery.trim().length < 2) {
      setError('Enter at least 2 characters');
      return;
    }

    setIsLoading(true);
    setShowSearchHistory(false);
    setError(null);
    setPage(0);

    try {
      const fullResults = await performFullSearch(searchQuery, 0);

      if (fullResults.mode === 'no-results') {
        // Trigger recovery mode
        const recovery = await getRecoveryResults(searchQuery);
        setResults({
          ...recovery,
          originalQuery: searchQuery,
        });
        setMode('recovery');
      } else if (fullResults.mode === 'error') {
        setError(fullResults.error.message || 'Search failed');
        setMode('error');
      } else {
        setResults(fullResults);
        setMode('full');
        setHasMore(true);
      }
    } catch (err) {
      console.error('Full search error:', err);
      setError(err.message || 'Search failed');
      setMode('error');
    } finally {
      setIsLoading(false);
    }
  };

  /* ===========================
     LOAD MORE (PAGINATION)
     =========================== */
  const handleLoadMore = async () => {
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
    } catch (err) {
      console.error('Load more failed:', err);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  /* ===========================
     INFINITE SCROLL OBSERVER
     =========================== */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          mode === 'full' &&
          !isLoading &&
          hasMore
        ) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [mode, isLoading, hasMore, page, query]);

  /* ===========================
     QUICK ACTIONS
     =========================== */
  const handleRecentSearchClick = (recentQuery) => {
    setQuery(recentQuery);
    setShowSearchHistory(false);
    // Trigger full search immediately
    setTimeout(() => {
      handleFullSearch({ target: { value: recentQuery } });
    }, 0);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  /* ===========================
     SKELETON LOADER
     =========================== */
  const SkeletonCard = () => (
    <div className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-700 rounded w-1/2" />
        <div className="h-10 bg-gray-700 rounded mt-3" />
      </div>
    </div>
  );

  /* ===========================
     RENDER: IDLE STATE
     =========================== */
  const renderIdleState = () => (
    <div className="text-center py-16">
      <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <p className="text-gray-400 text-lg mb-4">
        Search songs, artists, and albums
      </p>

      {/* Recent Searches */}
      {searchHistory.length > 0 && showSearchHistory && (
        <div className="mt-8 max-w-md mx-auto text-left">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Clock size={16} /> Recent Searches
            </h3>
            <button
              onClick={handleClearHistory}
              className="text-xs text-gray-500 hover:text-red-400"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1">
            {searchHistory.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleRecentSearchClick(item)}
                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded transition"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ===========================
     RENDER: PREVIEW STATE
     =========================== */
  const renderPreviewState = () => (
    <div>
      <p className="text-gray-400 text-sm mb-6">
        Showing preview — Press Enter for full results
      </p>

      {/* Preview Songs */}
      {results.songs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Songs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </div>
      )}

      {/* Preview Artists */}
      {results.artists.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Artists</h3>
          <div className="space-y-2">
            {results.artists.map((artist) => (
              <div
                key={artist.id}
                className="p-3 bg-gray-800 rounded hover:bg-gray-750 transition cursor-pointer"
              >
                <p className="font-medium">{artist.name}</p>
                <p className="text-xs text-gray-400">
                  {artist.songCount} songs
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ===========================
     RENDER: FULL STATE
     =========================== */
  const renderFullState = () => (
    <div>
      <p className="text-gray-400 text-sm mb-6">
        Showing {results.songs.length} of {results.total} results
      </p>

      {/* Songs Section */}
      {results.songs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Music size={20} /> Songs
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </div>
      )}

      {/* Artists Section */}
      {results.artists.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Artists</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.artists.map((artist) => (
              <div
                key={artist.id}
                className="p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition"
              >
                <p className="font-semibold text-lg">{artist.name}</p>
                <p className="text-sm text-gray-400">
                  {artist.songCount} song{artist.songCount !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Albums Section */}
      {results.albums.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Albums</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.albums.map((album) => (
              <div
                key={album.id}
                className="p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition flex items-start gap-3"
              >
                {album.image && (
                  <img
                    src={album.image}
                    alt={album.name}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{album.name}</p>
                  <p className="text-sm text-gray-400">
                    {album.songCount} song{album.songCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Load More Trigger */}
      <div ref={observerRef} className="mt-8 flex justify-center">
        {!hasMore && results.songs.length > 0 && (
          <p className="text-gray-500 text-sm">No more results</p>
        )}
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-100" />
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-200" />
          </div>
        )}
      </div>
    </div>
  );

  /* ===========================
     RENDER: NO RESULTS / RECOVERY
     =========================== */
  const renderRecoveryState = () => (
    <div>
      <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-lg p-4 mb-6">
        <p className="text-yellow-200 text-sm">
          No results for "{results.originalQuery}" — Here are trending songs
        </p>
      </div>

      {/* Trending Songs */}
      {results.trending && results.trending.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} /> Trending Now
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.trending.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {results.recentSearches && results.recentSearches.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock size={18} /> Try Recent Searches
          </h3>
          <div className="space-y-2">
            {results.recentSearches.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleRecentSearchClick(item)}
                className="block w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 rounded transition"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ===========================
     RENDER: ERROR STATE
     =========================== */
  const renderErrorState = () => (
    <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 flex gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-red-200 font-semibold">Search Error</p>
        <p className="text-red-100 text-sm mt-1">
          {error || 'Something went wrong. Please try again.'}
        </p>
      </div>
    </div>
  );

  /* ===========================
     MAIN RENDER
     =========================== */
  return (
    <div className="p-6 pb-32">
      {/* Search Bar (Sticky) */}
      <div className="mb-8 sticky top-0 bg-gray-900 py-4 z-40">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search songs, artists, albums..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleFullSearch}
            onFocus={() => {
              if (!query.trim()) setShowSearchHistory(true);
            }}
            onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
            className="w-full bg-gray-800 text-white rounded-full py-3 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
            autoFocus
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setMode('idle');
                setResults({ songs: [], artists: [], albums: [] });
                setShowSearchHistory(true);
              }}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {mode === 'error' && renderErrorState()}

      {/* Idle State */}
      {mode === 'idle' && renderIdleState()}

      {/* Loading State */}
      {isLoading && mode === 'idle' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Preview State */}
      {mode === 'preview' && !isLoading && renderPreviewState()}

      {/* Full State */}
      {mode === 'full' && renderFullState()}

      {/* Recovery State */}
      {mode === 'recovery' && renderRecoveryState()}
    </div>
  );
};

export default Search;