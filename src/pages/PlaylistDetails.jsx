import React from "react";
import { useParams } from "react-router-dom";
import { usePlaylists } from "../context/PlaylistsContext";
import { usePlayer } from "../context/PlayerContext";
import { Play, Trash2, Music } from "lucide-react";

export default function PlaylistDetails() {
  const { id } = useParams();
  const { playlists, removeSongFromPlaylist } = usePlaylists();
  const { playSong, addToQueue } = usePlayer();

  const playlist = playlists.find(p => p.id === id);

  if (!playlist) {
    return (
      <div className="p-6 text-gray-400">
        Playlist not found
      </div>
    );
  }

  const handlePlayAll = () => {
    if (playlist.songs.length === 0) return;
    playSong(playlist.songs[0]);
    playlist.songs.slice(1).forEach(song => addToQueue(song));
  };

  return (
    <div className="p-6 pb-32 text-white">
      <h1 className="text-3xl font-bold mb-6">
        {playlist.name}
      </h1>

      {playlist.songs.length === 0 ? (
        <div className="bg-gray-800 rounded p-8 text-center text-gray-400">
          No songs in this playlist
        </div>
      ) : (
        <>
          <button
            onClick={handlePlayAll}
            className="mb-6 px-6 py-2 bg-green-500 text-black rounded-full font-semibold"
          >
            <Play className="inline mr-2" />
            Play All
          </button>

          <div className="space-y-2">
            {playlist.songs.map((song, index) => (
              <div
                key={song.id}
                className="flex items-center gap-4 p-3 rounded hover:bg-gray-800"
              >
                <span className="w-6 text-gray-500">{index + 1}</span>

                {song.image ? (
                  <img
                    src={song.image}
                    alt={song.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <Music className="text-gray-500" />
                )}

                <div className="flex-1 overflow-hidden">
                  <p className="truncate">{song.name}</p>
                  <p className="text-sm text-gray-400 truncate">
                    {song.artist || "Unknown Artist"}
                  </p>
                </div>

                <button
                  onClick={() =>
                    removeSongFromPlaylist(playlist.id, song.id)
                  }
                  className="p-2 hover:bg-gray-700 rounded"
                >
                  <Trash2 className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
