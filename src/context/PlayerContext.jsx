// src/context/PlayerContext.jsx
// THIS FILE FIXES MOBILE AUDIO ISSUES

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
   STORAGE KEYS
   =========================== */
const RECENTLY_PLAYED_KEY = "auralyn:recently-played";
const QUEUE_KEY = "auralyn_queue";
const VOLUME_KEY = "auralyn_volume";
const SHUFFLE_KEY = "auralyn_shuffle";
const REPEAT_KEY = "auralyn_repeat";

/* ===========================
   MOBILE DETECTION
   =========================== */
const isMobile = () => {
  return (
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );
};

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
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  /* ===========================
     RECENTLY PLAYED
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
     AUDIO ELEMENT & WEB AUDIO API
     =========================== */
  const audioRef = useRef(new Audio());
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const isAudioContextSetRef = useRef(false);

  /* ===========================
     SETUP AUDIO CONTEXT FOR MOBILE
     =========================== */
  const setupAudioContext = useCallback(() => {
    if (isAudioContextSetRef.current || !isMobileDevice) return;
    if (!audioRef.current) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audioRef.current);
      const gainNode = ctx.createGain();

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      audioContextRef.current = ctx;
      gainNodeRef.current = gainNode;
      isAudioContextSetRef.current = true;

      console.log('✅ Web Audio API initialized for mobile');
    } catch (err) {
      console.warn('Web Audio API setup failed:', err);
    }
  }, [isMobileDevice]);

  /* ===========================
     DETECT MOBILE ON MOUNT
     =========================== */
  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);

  /* ===========================
     LOAD SAVED STATE
     =========================== */
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem(QUEUE_KEY);
      if (savedQueue) setQueue(JSON.parse(savedQueue));
    } catch (e) {
      console.error("Failed to load queue", e);
    }

    if (!isMobileDevice) {
      const savedVolume = localStorage.getItem(VOLUME_KEY);
      if (savedVolume) setVolume(Number(savedVolume));
    }

    const savedShuffle = localStorage.getItem(SHUFFLE_KEY);
    if (savedShuffle) setShuffle(savedShuffle === "true");

    const savedRepeat = localStorage.getItem(REPEAT_KEY);
    if (savedRepeat) setRepeat(savedRepeat);
  }, [isMobileDevice]);

  /* ===========================
     PERSIST STATE
     =========================== */
  useEffect(() => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    if (!isMobileDevice) {
      localStorage.setItem(VOLUME_KEY, volume);
    }
  }, [volume, isMobileDevice]);

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
     VOLUME CONTROL (MOBILE-SAFE)
     =========================== */
  useEffect(() => {
    const audio = audioRef.current;
    
    if (isMobileDevice) {
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = volume / 100;
      }
    } else {
      audio.volume = volume / 100;
    }
  }, [volume, isMobileDevice]);

  /* ===========================
     PLAY LOGIC
     =========================== */
  const playSong = useCallback((song) => {
    if (!song || !song.url) {
      console.warn('Invalid song or URL');
      return;
    }

    addToRecentlyPlayed(song);
    setCurrentSong(song);

    const audio = audioRef.current;
    
    // Set up CORS headers for audio
    audio.crossOrigin = "anonymous";
    audio.src = song.url;
    
    // Setup Web Audio API on first interaction (mobile requirement)
    if (isMobileDevice) {
      setupAudioContext();
    }

    // iOS specific: need user gesture
    audio.load();

    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('▶️ Playing:', song.name);
          setIsPlaying(true);
        })
        .catch((error) => {
          console.warn('Play error (might need user gesture):', error);
          // On mobile, user might need to tap play button
          setIsPlaying(false);
        });
    }
  }, [isMobileDevice, setupAudioContext]);

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
      // For mobile: need user gesture, this is called from button click
      audio.play()
        .then(() => {
          console.log('▶️ Resumed');
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Play failed:', err);
          setIsPlaying(false);
        });
    }
  };

  /* ===========================
     NEXT / PREVIOUS
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
     AUDIO EVENTS
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
    isMobileDevice,

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