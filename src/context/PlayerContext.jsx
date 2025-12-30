import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';

const PlayerContext = createContext();

/* ===========================
   STORAGE KEYS (SINGLE SOURCE)
   =========================== */
const RECENTLY_PLAYED_KEY = "auralyn:recently-played";
const QUEUE_KEY = "auralyn_queue";
const VOLUME_KEY = "auralyn_volume";
const SHUFFLE_KEY = "auralyn_shuffle";
const REPEAT_KEY = "auralyn_repeat";

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }) => {
  /* ===========================
     CORE PLAYER STATE
     =========================== */
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off');

  /* ===========================
     RECENTLY PLAYED (PERSISTENT)
     =========================== */
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    try {
      const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  /* ===========================
     AUDIO ELEMENT
     =========================== */
  const audioRef = useRef(new Audio());

  /* ===========================
     LOAD SAVED STATE (ONCE)
     =========================== */
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem(QUEUE_KEY);
      if (savedQueue) setQueue(JSON.parse(savedQueue));
    } catch (e) {
      console.error("Failed to load queue", e);
    }

    const savedVolume = localStorage.getItem(VOLUME_KEY);
    if (savedVolume) setVolume(Number(savedVolume));

    const savedShuffle = localStorage.getItem(SHUFFLE_KEY);
    if (savedShuffle) setShuffle(savedShuffle === "true");

    const savedRepeat = localStorage.getItem(REPEAT_KEY);
    if (savedRepeat) setRepeat(savedRepeat);
  }, []);

  /* ===========================
     PERSIST STATE
     =========================== */
  useEffect(() => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    localStorage.setItem(VOLUME_KEY, volume);
  }, [volume]);

  useEffect(() => {
    localStorage.setItem(SHUFFLE_KEY, shuffle);
  }, [shuffle]);

  useEffect(() => {
    localStorage.setItem(REPEAT_KEY, repeat);
  }, [repeat]);

  useEffect(() => {
    try {
      localStorage.setItem(
        RECENTLY_PLAYED_KEY,
        JSON.stringify(recentlyPlayed)
      );
    } catch (err) {
      console.error("Failed to save recently played", err);
    }
  }, [recentlyPlayed]);

  /* ===========================
     PLAY LOGIC
     =========================== */
  const playSong = (song) => {
    if (!song || !song.url) return;

    addToRecentlyPlayed(song);

    setCurrentSong(song);

    const audio = audioRef.current;
    audio.src = song.url;
    audio.load();

    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const addToRecentlyPlayed = (song) => {
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(s => s.id !== song.id);
      return [song, ...filtered].slice(0, 20);
    });
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true));
    }
  };

  /* ===========================
     NEXT / PREVIOUS (STABILIZED)
     =========================== */
  const handleNext = useCallback(() => {
    if (!queue.length) return;

    if (repeat === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }

    const index = queue.findIndex(s => s.id === currentSong?.id);
    let nextIndex = shuffle
      ? Math.floor(Math.random() * queue.length)
      : index + 1;

    if (nextIndex >= queue.length) {
      if (repeat === 'all') nextIndex = 0;
      else return;
    }

    playSong(queue[nextIndex]);
  }, [queue, repeat, shuffle, currentSong, playSong]);

  const handlePrevious = () => {
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const index = queue.findIndex(s => s.id === currentSong?.id);
    if (index > 0) playSong(queue[index - 1]);
  };

  /* ===========================
     AUDIO EVENTS (FIXED)
     =========================== */
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => handleNext();
    const handleError = (e) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [handleNext]);

  useEffect(() => {
    audioRef.current.volume = volume / 100;
  }, [volume]);

  /* ===========================
     QUEUE MANAGEMENT
     =========================== */
  const addToQueue = (song) => {
    setQueue(prev => prev.some(s => s.id === song.id) ? prev : [...prev, song]);
  };

  const addMultipleToQueue = (songs) => {
    setQueue(prev => [
      ...prev,
      ...songs.filter(s => !prev.some(p => p.id === s.id))
    ]);
  };

  const removeFromQueue = (songId) => {
    setQueue(prev => prev.filter(s => s.id !== songId));
  };

  const clearQueue = () => setQueue([]);

  const playQueue = (songs, startIndex = 0) => {
    setQueue(songs);
    playSong(songs[startIndex]);
  };

  const seekTo = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const toggleShuffle = () => setShuffle(p => !p);

  const toggleRepeat = () => {
    setRepeat(p => p === 'off' ? 'all' : p === 'all' ? 'one' : 'off');
  };

  /* ===========================
     CONTEXT VALUE
     =========================== */
  const value = {
    currentSong,
    queue,
    isPlaying,
    volume,
    currentTime,
    duration,
    shuffle,
    repeat,
    recentlyPlayed,

    playSong,
    togglePlay,
    handleNext,
    handlePrevious,
    addToQueue,
    addMultipleToQueue,
    removeFromQueue,
    clearQueue,
    playQueue,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContext;