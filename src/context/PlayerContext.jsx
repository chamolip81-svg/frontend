// src/context/PlayerContext.jsx
// MOBILE AUDIO SAFE – FULL VERSION (NO FEATURES REMOVED)

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from "react";

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
const isMobile = () =>
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
};

export const PlayerProvider = ({ children }) => {
  /* ===========================
     CORE STATE
  =========================== */
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("off");
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
     AUDIO SETUP
  =========================== */
  const audioRef = useRef(new Audio());
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const isAudioContextSetRef = useRef(false);

  /* ===========================
     MOBILE AUDIO CONTEXT
  =========================== */
  const setupAudioContext = useCallback(() => {
    if (!isMobileDevice || isAudioContextSetRef.current) return;

    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audioRef.current);
      const gainNode = ctx.createGain();

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      audioContextRef.current = ctx;
      gainNodeRef.current = gainNode;
      isAudioContextSetRef.current = true;
    } catch (err) {
      console.warn("Web Audio API init failed", err);
    }
  }, [isMobileDevice]);

  /* ===========================
     DETECT MOBILE
  =========================== */
  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);

  /* ===========================
     LOAD SAVED STATE
  =========================== */
  useEffect(() => {
    try {
      const q = localStorage.getItem(QUEUE_KEY);
      if (q) setQueue(JSON.parse(q));
    } catch {}

    if (!isMobileDevice) {
      const v = localStorage.getItem(VOLUME_KEY);
      if (v) setVolume(Number(v));
    }

    const s = localStorage.getItem(SHUFFLE_KEY);
    if (s) setShuffle(s === "true");

    const r = localStorage.getItem(REPEAT_KEY);
    if (r) setRepeat(r);
  }, [isMobileDevice]);

  /* ===========================
     SAVE STATE
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
    localStorage.setItem(
      RECENTLY_PLAYED_KEY,
      JSON.stringify(recentlyPlayed)
    );
  }, [recentlyPlayed]);

  /* ===========================
     VOLUME (MOBILE SAFE)
  =========================== */
  useEffect(() => {
    const audio = audioRef.current;
    if (isMobileDevice && gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100;
    } else {
      audio.volume = volume / 100;
    }
  }, [volume, isMobileDevice]);

  /* ===========================
     PLAY SONG (NO AUTOPLAY)
  =========================== */
  const playSong = useCallback(
    (song) => {
      if (!song || !song.url) return;

      const audio = audioRef.current;

      audio.pause();
      audio.src = song.url;
      audio.crossOrigin = "anonymous";
      audio.playsInline = true;
      audio.preload = "metadata";
      audio.load();

      setCurrentSong(song);
      setIsPlaying(false);

      setRecentlyPlayed((prev) => {
        const filtered = prev.filter((s) => s.id !== song.id);
        return [song, ...filtered].slice(0, 20);
      });

      if (isMobileDevice) setupAudioContext();
    },
    [isMobileDevice, setupAudioContext]
  );

  /* ===========================
     USER TAP PLAY (FIXED – DO NOT TOUCH)
  =========================== */
  const togglePlay = async () => {
    const audio = audioRef.current;

    try {
      // 🔴 ONLY FIX: resume AudioContext on user gesture (mobile sound unblock)
      if (
        audioContextRef.current &&
        audioContextRef.current.state === "suspended"
      ) {
        await audioContextRef.current.resume();
      }

      audio.muted = false;
      audio.volume = volume / 100;

      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Mobile play blocked:", err);
    }
  };

  /* ===========================
     NEXT / PREVIOUS
  =========================== */
  const handleNext = useCallback(() => {
    if (!queue.length) return;

    if (repeat === "one") {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }

    const index = queue.findIndex((s) => s.id === currentSong?.id);
    let nextIndex = shuffle
      ? Math.floor(Math.random() * queue.length)
      : index + 1;

    if (nextIndex >= queue.length) {
      if (repeat === "all") nextIndex = 0;
      else return;
    }

    playSong(queue[nextIndex]);
  }, [queue, repeat, shuffle, currentSong, playSong]);

  const handlePrevious = () => {
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const index = queue.findIndex((s) => s.id === currentSong?.id);
    if (index > 0) playSong(queue[index - 1]);
  };

  /* ===========================
     AUDIO EVENTS
  =========================== */
  useEffect(() => {
    const audio = audioRef.current;

    const t = () => setCurrentTime(audio.currentTime);
    const d = () => setDuration(audio.duration);
    const e = () => handleNext();

    audio.addEventListener("timeupdate", t);
    audio.addEventListener("loadedmetadata", d);
    audio.addEventListener("ended", e);

    return () => {
      audio.removeEventListener("timeupdate", t);
      audio.removeEventListener("loadedmetadata", d);
      audio.removeEventListener("ended", e);
    };
  }, [handleNext]);

  /* ===========================
     QUEUE HELPERS
  =========================== */
  const addToQueue = (song) =>
    setQueue((p) => (p.some((s) => s.id === song.id) ? p : [...p, song]));

  const addMultipleToQueue = (songs) =>
    setQueue((p) => [
      ...p,
      ...songs.filter((s) => !p.some((x) => x.id === s.id)),
    ]);

  const removeFromQueue = (id) =>
    setQueue((p) => p.filter((s) => s.id !== id));

  const clearQueue = () => setQueue([]);

  const playQueue = (songs, index = 0) => {
    setQueue(songs);
    playSong(songs[index]);
  };

  const seekTo = (t) => {
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const toggleShuffle = () => setShuffle((p) => !p);
  const toggleRepeat = () =>
    setRepeat((p) => (p === "off" ? "all" : p === "all" ? "one" : "off"));

  /* ===========================
     CONTEXT VALUE
  =========================== */
  return (
    <PlayerContext.Provider
      value={{
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
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContext;
