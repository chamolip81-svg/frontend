// frontend/src/components/SongCard.jsx
import React, { useState } from 'react';
import { Play, Plus, MoreVertical, Heart } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useFavorites } from "../context/FavoritesContext";
import PlaylistModal from "./PlaylistModal";
// import { Download, CheckCircle } from "lucide-react";
// import { useOffline } from "../context/OfflineContext";

const SongCard = ({ song }) => {
  const { playSong, addToQueue, currentSong, isPlaying } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const favorited = isFavorite(song.id);
  const isCurrentSong = currentSong?.id === song.id;

  // Handle play button click
  const handlePlay = (e) => {
    e.stopPropagation();
    playSong(song);
  };

  // Handle add to queue
  const handleAddToQueue = (e) => {
    e.stopPropagation();
    addToQueue(song);
    setShowMenu(false);
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fallbackImage =
    'https://via.placeholder.com/300x300/1f2937/10b981?text=♪';

  const imageSrc = imageError
    ? fallbackImage
    : (song.image || fallbackImage);

  return (
    <div
      className={`
        relative group bg-gray-800 rounded-lg overflow-hidden
        transition-all duration-300 hover:bg-gray-750 cursor-pointer
        ${isCurrentSong && isPlaying ? 'ring-2 ring-green-500' : ''}
      `}
    >
      {/* Album Art */}
      <div className="relative aspect-square overflow-hidden bg-gray-900">
        <img
          src={imageSrc}
          alt={song.name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* ❤️ Favorite */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(song);
          }}
          className="absolute top-2 right-2 z-20 p-2 rounded-full
                     bg-black/60 hover:bg-black/80 transition"
        >
          <Heart
            size={18}
            className={
              favorited
                ? "fill-red-500 text-red-500"
                : "text-white"
            }
          />
        </button>

        {/* ▶ Play Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0
                        group-hover:bg-opacity-40 transition
                        flex items-center justify-center">
          <button
            onClick={handlePlay}
            className="opacity-0 group-hover:opacity-100
                       transform scale-75 group-hover:scale-100
                       transition bg-green-500 rounded-full p-4"
          >
            <Play className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>

      {/* Info */}
      {/* 🔽 padding adjusted ONLY for mobile */}
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-white truncate mb-1">
          {song.name}
        </h3>

        <p className="text-sm text-gray-400 truncate mb-2">
          {song.artist || 'Unknown Artist'}
        </p>

        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <span className="truncate">{song.album || 'Single'}</span>
          {song.duration > 0 && (
            <span>{formatDuration(song.duration)}</span>
          )}
        </div>

        {/* Actions */}
        {/* 🔽 Mobile-friendly layout */}
        <div className="flex gap-2 items-center">
          {/* ▶ PLAY — bigger tap target */}
          <button
            onClick={handlePlay}
            className="
              flex-1 bg-green-500 text-white rounded-md
              py-2 sm:py-2.5
              flex justify-center gap-2
              text-sm sm:text-base
            "
          >
            <Play className="w-4 h-4 fill-current" />
            Play
          </button>

          {/* Secondary actions (kept intact) */}
          <div className="flex gap-2">
            {/* ➕ ADD TO QUEUE */}
            <button
              onClick={handleAddToQueue}
              className="bg-gray-700 p-2 rounded"
              title="Add to queue"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* ⋮ MENU BUTTON — UNCHANGED */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="bg-gray-700 p-2 rounded"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 🔽 DROPDOWN MENU */}
      {showMenu && (
        <div
          className="absolute right-2 top-14 bg-gray-900
                     border border-gray-700 rounded-md
                     shadow-lg z-50 min-w-[160px]"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              setShowPlaylistModal(true);
            }}
            className="block w-full text-left px-4 py-2
                       text-sm hover:bg-gray-800"
          >
            ➕ Add to playlist
          </button>
        </div>
      )}

      {/* 🔽 PLAYLIST MODAL */}
      {showPlaylistModal && (
        <PlaylistModal
          song={song}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}
    </div>
  );
};

export default SongCard;
