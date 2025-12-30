import { Heart, Music, Play, Trash2 } from "lucide-react";
import { useFavorites } from "../context/FavoritesContext";
import { usePlayer } from "../context/PlayerContext";

export default function Favorites() {
  const { favorites, toggleFavorite } = useFavorites();
  const { playSong, addToQueue } = usePlayer();

  const handlePlayAll = () => {
    if (favorites.length === 0) return;
    playSong(favorites[0]);
    favorites.slice(1).forEach((song) => addToQueue(song));
  };

  return (
    <div className="p-6 pb-32">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <Heart size={64} className="text-white" fill="white" />
          </div>
          <div>
            <p className="text-sm text-gray-400 uppercase">Playlist</p>
            <h1 className="text-4xl font-bold mb-2">Liked Songs</h1>
            <p className="text-gray-400">{favorites.length} songs</p>
            {favorites.length > 0 && (
              <button
                onClick={handlePlayAll}
                className="mt-4 px-6 py-2 bg-green-500 text-black rounded-full font-semibold hover:bg-green-600 transition flex items-center gap-2"
              >
                <Play size={18} fill="currentColor" />
                Play All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Songs List */}
      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={64} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">No liked songs yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Search for songs and click the heart to add them
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {favorites.map((song, index) => (
            <div
              key={song.id}
              className="flex items-center gap-4 p-3 hover:bg-gray-900 rounded transition group"
            >
              {/* Index */}
              <span className="text-gray-500 w-8 text-center">{index + 1}</span>

              {/* Album Art */}
              {song.image ? (
                <img
                  src={song.image}
                  alt={song.name}
                  className="w-12 h-12 rounded object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-gray-800 flex items-center justify-center">
                  <Music size={20} className="text-gray-600" />
                </div>
              )}


              {/* Song Info */}
              <div className="flex-1 overflow-hidden">
                <p className="font-medium truncate">{song.name}</p>
                <p className="text-sm text-gray-400 truncate">
                  {song.artist || "Unknown Artist"}

                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => playSong(song)}
                  className="p-2 hover:bg-gray-800 rounded transition"
                  title="Play"
                >
                  <Play size={18} className="text-green-500" fill="currentColor" />
                </button>
                <button
                  onClick={() => toggleFavorite(song)}
                  className="p-2 hover:bg-gray-800 rounded transition"
                  title="Remove from favorites"
                >
                  <Trash2 size={18} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}