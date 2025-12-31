import React, { useState, memo } from "react";
import { Play, Plus, MoreVertical, Heart } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { useFavorites } from "../context/FavoritesContext";
import PlaylistModal from "./PlaylistModal";

const SongCard = memo(({ song }) => {
  const { playSong, addToQueue, currentSong, isPlaying } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const favorited = isFavorite(song.id);
  const isCurrentSong = currentSong?.id === song.id;

  const handlePlay = (e) => {
    e.stopPropagation();
    playSong(song);
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

  const imageSrc = imageError ? fallbackImage : song.image || fallbackImage;

  return (
    <div
      className={`
        relative bg-gray-800 rounded-lg overflow-hidden
        transition hover:bg-gray-750 cursor-pointer
        ${isCurrentSong && isPlaying ? "ring-2 ring-green-500" : ""}
        flex sm:block
      `}
    >
      {/* IMAGE */}
      <div
        className="
          relative bg-gray-900
          w-24 h-24 sm:w-full sm:aspect-square
          flex-shrink-0
        "
      >
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-700 animate-pulse" />
        )}

        <img
          src={imageSrc}
          alt={song.name}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
          className={`
            w-full h-full object-cover
            transition
            ${imageLoaded ? "opacity-100" : "opacity-0"}
          `}
        />

        {/* FAVORITE */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(song);
          }}
          className="absolute top-1 right-1 z-10 p-1.5 rounded-full bg-black/60"
        >
          <Heart
            size={14}
            className={favorited ? "fill-red-500 text-red-500" : "text-white"}
          />
        </button>

        {/* PLAY OVERLAY (DESKTOP ONLY) */}
        <div className="hidden sm:flex absolute inset-0 bg-black/40 items-center justify-center">
          <button
            onClick={handlePlay}
            className="bg-green-500 rounded-full p-3"
          >
            <Play className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>

      {/* INFO */}
      <div className="p-3 flex-1">
        <h3 className="font-semibold text-white text-sm truncate">
          {song.name}
        </h3>

        <p className="text-xs text-gray-400 truncate">
          {song.artist || "Unknown Artist"}
        </p>

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span className="truncate">{song.album || "Single"}</span>
          {song.duration > 0 && <span>{formatDuration(song.duration)}</span>}
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2 items-center mt-2">
          <button
            onClick={handlePlay}
            className="flex-1 bg-green-500 text-white rounded-md py-1.5 text-sm flex justify-center gap-1"
          >
            <Play className="w-4 h-4 fill-current" />
            Play
          </button>

          <button
            onClick={handleAddToQueue}
            className="bg-gray-700 p-2 rounded"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="bg-gray-700 p-2 rounded"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {showMenu && (
        <div className="absolute right-2 top-12 bg-gray-900 border border-gray-700 rounded shadow z-50">
          <button
            onClick={() => {
              setShowMenu(false);
              setShowPlaylistModal(true);
            }}
            className="block px-4 py-2 text-sm hover:bg-gray-800"
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
});

SongCard.displayName = "SongCard";
export default SongCard;
