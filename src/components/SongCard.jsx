// frontend/src/components/SongCard.jsx
import React, { useState, memo } from "react";
import { Play, Plus, MoreVertical, Heart } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { useFavorites } from "../context/FavoritesContext";
import PlaylistModal from "./PlaylistModal";

const SongCard = memo(({ song }) => {
  const {
    playSong,
    togglePlay,
    addToQueue,
    currentSong,
    isPlaying,
  } = usePlayer();

  const { isFavorite, toggleFavorite } = useFavorites();

  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const favorited = isFavorite(song.id);
  const isCurrentSong = currentSong?.id === song.id;

  /* ===========================
     MOBILE-SAFE PLAY HANDLER
  =========================== */
  const handlePlay = async (e) => {
    e.stopPropagation();

    if (!isCurrentSong) {
      playSong(song);          // prepare song
      setTimeout(() => {
        togglePlay();          // 🔴 actual user-triggered play
      }, 0);
    } else {
      togglePlay();            // pause / resume
    }
  };

  const handleAddToQueue = (e) => {
    e.stopPropagation();
    addToQueue(song);
    setShowMenu(false);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const fallbackImage =
    "https://via.placeholder.com/300x300/1f2937/10b981?text=♪";

  const imageSrc = imageError
    ? fallbackImage
    : song.image || fallbackImage;

  return (
    <div
      className={`
        relative group bg-gray-800 rounded-lg overflow-hidden
        transition-all duration-300 hover:bg-gray-750 cursor-pointer
        ${isCurrentSong && isPlaying ? "ring-2 ring-green-500" : ""}
      `}
    >
      {/* ===========================
         ALBUM ART (MOBILE FRIENDLY)
      =========================== */}
      <div className="relative aspect-square overflow-hidden bg-gray-900">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-700 animate-pulse"></div>
        )}

        <img
          src={imageSrc}
          alt={song.name}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
          className={`
            w-full h-full object-cover transition-all duration-300
            group-hover:scale-110
            ${imageLoaded ? "opacity-100" : "opacity-0"}
          `}
        />

        {/* Favorite */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(song);
          }}
          className="
            absolute top-2 right-2 z-20
            p-1.5 sm:p-2
            rounded-full bg-black/60 hover:bg-black/80 transition
          "
        >
          <Heart
            size={16}
            className={
              favorited ? "fill-red-500 text-red-500" : "text-white"
            }
          />
        </button>

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
          <button
            onClick={handlePlay}
            className="
              opacity-100 sm:opacity-0 group-hover:opacity-100
              transform scale-90 group-hover:scale-100 transition
              bg-green-500 rounded-full
              p-3 sm:p-4
            "
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
          </button>
        </div>
      </div>

      {/* ===========================
         INFO (MOBILE OPTIMIZED)
      =========================== */}
      <div className="p-2.5 sm:p-4">
        <h3 className="font-semibold text-white truncate text-sm sm:text-base mb-0.5">
          {song.name}
        </h3>

        <p className="text-xs sm:text-sm text-gray-400 truncate mb-1.5">
          {song.artist || "Unknown Artist"}
        </p>

        <div className="flex justify-between text-[11px] sm:text-xs text-gray-500 mb-2">
          <span className="truncate">{song.album || "Single"}</span>
          {song.duration > 0 && (
            <span>{formatDuration(song.duration)}</span>
          )}
        </div>

        {/* ===========================
           ACTIONS
        =========================== */}
        <div className="flex gap-2 items-center">
          <button
            onClick={handlePlay}
            className="
              flex-1 bg-green-500 text-white
              rounded-md py-1.5 sm:py-2.5
              flex justify-center gap-2
              text-xs sm:text-sm
              hover:bg-green-600 transition
            "
          >
            <Play className="w-4 h-4 fill-current" />
            {isCurrentSong && isPlaying ? "Pause" : "Play"}
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleAddToQueue}
              className="bg-gray-700 p-2 rounded hover:bg-gray-600 transition"
              title="Add to queue"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="bg-gray-700 p-2 rounded hover:bg-gray-600 transition"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ===========================
         MENU
      =========================== */}
      {showMenu && (
        <div className="absolute right-2 top-14 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-50 min-w-[160px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              setShowPlaylistModal(true);
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition"
          >
            ➕ Add to playlist
          </button>
        </div>
      )}

      {showPlaylistModal && (
        <PlaylistModal
          song={song}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.song.id === nextProps.song.id;
});

SongCard.displayName = "SongCard";

export default SongCard;
