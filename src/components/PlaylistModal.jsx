import React, { useState } from "react";
import { X, Plus, Music } from "lucide-react";
import { usePlaylists } from "../context/PlaylistsContext";

export default function PlaylistModal({ song, onClose }) {
  const {
    playlists,
    createPlaylist,
    addSongToPlaylist,
  } = usePlaylists();

  const [newPlaylistName, setNewPlaylistName] = useState("");

  const handleCreateAndAdd = () => {
    if (!newPlaylistName.trim()) return;

    const name = newPlaylistName.trim();
    createPlaylist(name);

    // Wait one tick so playlist exists
    setTimeout(() => {
      const created = playlists.find(p => p.name === name);
      if (created) {
        addSongToPlaylist(created.id, song);
      }
    }, 0);

    onClose();
  };

  const handleAddToExisting = (playlistId) => {
    addSongToPlaylist(playlistId, song);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center">
      <div className="bg-gray-900 w-full max-w-md rounded-lg shadow-lg p-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Add to playlist
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded"
          >
            <X />
          </button>
        </div>

        {/* Song info */}
        <div className="flex items-center gap-3 mb-6">
          {song.image ? (
            <img
              src={song.image}
              alt={song.name}
              className="w-12 h-12 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
              <Music size={20} />
            </div>
          )}

          <div className="overflow-hidden">
            <p className="font-medium truncate">{song.name}</p>
            <p className="text-sm text-gray-400 truncate">
              {song.artist || "Unknown Artist"}
            </p>
          </div>
        </div>

        {/* Existing playlists */}
        {playlists.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">
              Add to existing playlist
            </p>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToExisting(playlist.id)}
                  className="
                    w-full text-left px-4 py-2
                    bg-gray-800 hover:bg-gray-700
                    rounded transition
                  "
                >
                  {playlist.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create new playlist */}
        <div>
          <p className="text-sm text-gray-400 mb-2">
            Create new playlist
          </p>

          <div className="flex gap-2">
            <input
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="
                flex-1 bg-gray-800 text-white
                rounded px-3 py-2
                focus:outline-none
              "
            />
            <button
              onClick={handleCreateAndAdd}
              className="
                px-4 py-2 bg-green-500
                text-black rounded
                hover:bg-green-600
                flex items-center gap-1
              "
            >
              <Plus size={16} />
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
