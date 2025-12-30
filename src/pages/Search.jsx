import React, { useState, useRef, useEffect } from 'react';
import { Search as SearchIcon, AlertCircle } from 'lucide-react';
import { searchSongs } from '../services/api';
import SongCard from '../components/SongCard';

// 🔧 Tuned values
const MAX_EMPTY_PAGES = 6;
const MAX_SCAN_PAGES = 6; // ✅ Reduced Saavn load

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  const observerTarget = useRef(null);
  const searchTimeoutRef = useRef(null);
  const resultsRef = useRef([]);

  // existing
  const emptyPageCountRef = useRef(0);
  const scanPageCountRef = useRef(0);

  // ✅ NEW: cache already-fetched pages (huge speed win)
  const pageCacheRef = useRef(new Map());

  // Perform the search
  const performSearch = async (searchQuery, pageNum = 0) => {
    if (!searchQuery.trim()) {
      setResults([]);
      resultsRef.current = [];
      setHasSearched(false);
      setError(null);
      setPage(0);
      setHasMore(true);
      emptyPageCountRef.current = 0;
      scanPageCountRef.current = 0;
      pageCacheRef.current.clear(); // ✅ reset cache
      return;
    }

    const isFirstPage = pageNum === 0;

    // ✅ 1️⃣ Prevent overlapping requests
    if (isLoadingMore && !isFirstPage) {
      console.warn('⏳ Skipping overlapping request for page', pageNum);
      return;
    }

    if (isFirstPage) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    setError(null);
    setHasSearched(true);

    try {
      let songs, total;

      // ✅ 3️⃣ Page cache check
      if (pageCacheRef.current.has(pageNum)) {
        const cached = pageCacheRef.current.get(pageNum);
        songs = cached.songs;
        total = cached.total;
        console.log(`📦 Using cached page ${pageNum}`);
      } else {
        const response = await searchSongs(searchQuery, pageNum);
        songs = response.songs;
        total = response.total;

        pageCacheRef.current.set(pageNum, { songs, total });
        console.log(`🌐 Fetched page ${pageNum} from API`);
      }

      console.log(`📥 Page ${pageNum}: Got ${songs?.length || 0} songs`);

      if (isFirstPage) {
        setResults(songs || []);
        resultsRef.current = songs || [];
        setTotalResults(total);
        setHasMore(true);
        setPage(0);

        emptyPageCountRef.current = 0;
        scanPageCountRef.current = 0;

        console.log(`✅ Page 0: Loaded ${songs?.length || 0} songs`);
        return;
      }

      // ---- STREAM-STYLE UNIQUE DISCOVERY ----

      const existingIds = new Set(resultsRef.current.map(s => s.id));
      const newSongs = (songs || []).filter(s => !existingIds.has(s.id));

      console.log(
        `🔄 Page ${pageNum}: ${songs?.length || 0} total, ${newSongs.length} new`
      );

      scanPageCountRef.current += 1;

      if (newSongs.length > 0) {
        emptyPageCountRef.current = 0;

        const combined = [...resultsRef.current, ...newSongs];
        resultsRef.current = combined;
        setResults(combined);
        setPage(pageNum);
        setTotalResults(total);

        scanPageCountRef.current = 0;

        // ✅ 4️⃣ Parallel scan (SAFE PRELOAD, future-ready)
        const nextPage = pageNum + 1;
        if (
          !pageCacheRef.current.has(nextPage) &&
          scanPageCountRef.current < MAX_SCAN_PAGES
        ) {
          searchSongs(searchQuery, nextPage)
            .then(res => {
              pageCacheRef.current.set(nextPage, {
                songs: res.songs,
                total: res.total
              });
              console.log(`⚡ Preloaded page ${nextPage}`);
            })
            .catch(() => { });
        }
      } else {
        // duplicate-only page → continue scanning
        emptyPageCountRef.current += 1;

        console.warn(
          `⚠️ Duplicate-only page ${pageNum}. Empty streak: ${emptyPageCountRef.current}`
        );

        if (
          emptyPageCountRef.current >= MAX_EMPTY_PAGES ||
          scanPageCountRef.current >= MAX_SCAN_PAGES
        ) {
          console.warn('🛑 Stopping after deep scan exhaustion');
          setHasMore(false);
        } else {
          performSearch(searchQuery, pageNum + 1); // 🔥 continue scan
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search songs');

      if (isFirstPage) {
        setResults([]);
        resultsRef.current = [];
      }
    } finally {
      if (isFirstPage) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  // Debounced input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value, 0);
    }, 500);
  };

  // Load more trigger
  const loadMore = () => {
    if (!isLoadingMore && hasMore && query.trim()) {
      performSearch(query, page + 1);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !isLoading &&
          hasSearched
        ) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [hasMore, isLoadingMore, isLoading, hasSearched, page, query]);

  // Skeleton
  const SkeletonCard = () => (
    <div className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-700 rounded w-1/2" />
        <div className="h-3 bg-gray-700 rounded w-2/3" />
      </div>
    </div>
  );

  return (
    <div className="p-6 pb-32">
      <div className="mb-8 sticky top-0 bg-gray-900 py-4 z-40">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search songs, artists, albums..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setHasSearched(true);
                setPage(0);
              }
            }}

            className="w-full bg-gray-800 text-white rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            autoFocus
          />

        </div>
      </div>

      {hasSearched && !isLoading && results.length > 0 && (
        <p className="text-gray-400 text-sm mb-4">
          Showing {results.length} of {totalResults} songs
        </p>
      )}

      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.map(song => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>

          <div ref={observerTarget} className="mt-8 flex justify-center">
            {!hasMore && (
              <p className="text-gray-500 text-sm">No more unique songs</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Search;
