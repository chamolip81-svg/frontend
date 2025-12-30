import { X, Trash2, Music2 } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";

export default function QueueDrawer({ onClose }) {
  const {
    queue,
    queueIndex,
    playSong,
    removeFromQueue,
    clearQueue,
  } = usePlayer();

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Overlay */}
      <div
        className="flex-1 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="w-80 max-w-full bg-black border-l border-gray-800 flex flex-col animate-slide-in shadow-2xl">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <div>
            <h3 className="font-semibold text-lg">Queue</h3>
            <p className="text-xs text-gray-500">{queue.length} songs</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm p-6">
              <Music2 size={48} className="mb-4 opacity-30" />
              <p className="font-medium">Queue is empty</p>
              <p className="text-xs mt-2 text-gray-600 text-center">
                Search for songs and add them to get started
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {queue.map((song, index) => {
                const isActive = index === queueIndex;

                return (
                  <div
                    key={`${song.id}-${index}`}
                    onClick={() => playSong(song, true)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${
                      isActive
                        ? "bg-green-500/10 border-l-4 border-green-500"
                        : "hover:bg-gray-900"
                    }`}
                  >
                    {/* Album Art */}
                    {song.image?.[0]?.link ? (
                      <img
                        src={song.image[0].link}
                        alt={song.name}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-800 flex-shrink-0" />
                    )}

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`truncate text-sm transition ${
                          isActive
                            ? "text-green-400 font-semibold"
                            : "text-white font-medium"
                        }`}
                      >
                        {song.name}
                      </p>
                      <p className="truncate text-xs text-gray-400">
                        {song.primaryArtists}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {isActive ? (
                        <span className="text-xs font-semibold text-green-400 bg-green-500/20 px-2 py-1 rounded">
                          Playing
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromQueue(song.id);
                          }}
                          className="p-1 text-gray-500 hover:text-red-400 hover:bg-gray-900 rounded transition"
                          title="Remove from queue"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {queue.length > 0 && (
          <div className="border-t border-gray-800 p-3">
            <button
              onClick={clearQueue}
              className="w-full py-2 px-4 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded transition"
            >
              Clear Queue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}