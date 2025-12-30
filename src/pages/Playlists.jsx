import React from "react";
import { Music, Trash2, Play } from "lucide-react";
import { usePlaylists } from "../context/PlaylistsContext";
import { usePlayer } from "../context/PlayerContext";
import { useNavigate } from "react-router-dom";

export default function Playlists() {
  const { playlists, deletePlaylist } = usePlaylists();
  const { playSong, addToQueue } = usePlayer();
  const navigate = useNavigate();

  const handlePlayPlaylist = (playlist) => {
    if (!playlist.songs.length) return;

    playSong(playlist.songs[0]);
    playlist.songs.slice(1).forEach((song) => addToQueue(song));
  };

  return (
    <div className="p-6 pb-32">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6">Your Playlists</h1>

      {/* Empty state */}
      {playlists.length === 0 && (
        <div className="text-center py-16">
          <Music size={64} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">No playlists yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Add songs to playlists using the ⋮ menu
          </p>
        </div>
      )}

      {/* Playlist list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            onClick={() => navigate(`/playlists/${playlist.id}`)}
            className="
              bg-gray-800 rounded-lg p-4
              hover:bg-gray-750 transition relative
              cursor-pointer
            "
          >
            {/* Playlist cover */}
            {playlist.songs.length > 0 && playlist.songs[0].image ? (
              <img
                src={playlist.songs[0].image}
                alt={playlist.name}
                className="w-16 h-16 rounded object-cover mb-4"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-700 rounded flex items-center justify-center mb-4">
                <Music size={28} className="text-gray-300" />
              </div>
            )}

            {/* Playlist info */}
            <h3 className="font-semibold text-white truncate">
              {playlist.name}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {playlist.songs.length} songs
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // ⛔ prevent navigation
                  handlePlayPlaylist(playlist);
                }}
                className="
                  flex-1 bg-green-500 hover:bg-green-600
                  text-black rounded py-2 text-sm
                  flex items-center justify-center gap-2
                "
              >
                <Play size={16} fill="currentColor" />
                Play
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation(); // ⛔ prevent navigation
                  deletePlaylist(playlist.id);
                }}
                className="
                  p-2 bg-gray-700 hover:bg-red-600
                  rounded transition
                "
                title="Delete playlist"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
