// frontend/src/components/Player.jsx
import React, { useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Repeat, Shuffle, List 
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const Player = () => {
  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    shuffle,
    repeat,
    queue,
    isMobileDevice,
    togglePlay,
    handleNext,
    handlePrevious,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
  } = usePlayer();

  const [showQueue, setShowQueue] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Don't render if no song is playing
  if (!currentSong) return null;

  // Format time from seconds to MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle progress bar click
  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seekTo(percent * duration);
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    setVolume(Number(e.target.value));
  };

  // Calculate progress percentage
  const progressPercent = (currentTime / duration) * 100 || 0;

  // Fallback image if album art fails
  const imageSrc = imageError
    ? 'https://via.placeholder.com/80x80/1f2937/10b981?text=♪'
    : (currentSong.image || 'https://via.placeholder.com/80x80/1f2937/10b981?text=♪');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-3 z-50">
      <div className="max-w-screen-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-3">
          <div
            onClick={handleProgressClick}
            className="h-1 bg-gray-700 rounded-full cursor-pointer group hover:h-1.5 transition-all"
          >
            <div
              className="h-full bg-green-500 rounded-full transition-all group-hover:bg-green-400"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Song Info - Left Side */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={imageSrc}
              alt={currentSong.name}
              onError={() => setImageError(true)}
              className="w-14 h-14 rounded-md object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-semibold truncate">
                {currentSong.name}
              </h4>
              <p className="text-sm text-gray-400 truncate">
                {currentSong.artist}
              </p>
            </div>
          </div>

          {/* Playback Controls - Center */}
          <div className="flex items-center gap-4">
            {/* Shuffle Button */}
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-colors ${
                shuffle
                  ? 'text-green-500 bg-green-500 bg-opacity-20'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Previous"
            >
              <SkipBack className="w-6 h-6" />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="p-3 bg-white hover:bg-gray-200 rounded-full transition-all transform hover:scale-105"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-black fill-current" />
              ) : (
                <Play className="w-6 h-6 text-black fill-current ml-0.5" />
              )}
            </button>

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Next"
            >
              <SkipForward className="w-6 h-6" />
            </button>

            {/* Repeat Button */}
            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-full transition-colors relative ${
                repeat !== 'off'
                  ? 'text-green-500 bg-green-500 bg-opacity-20'
                  : 'text-gray-400 hover:text-white'
              }`}
              title={`Repeat: ${repeat}`}
            >
              <Repeat className="w-5 h-5" />
              {repeat === 'one' && (
                <span className="absolute top-0 right-0 text-xs font-bold">1</span>
              )}
            </button>
          </div>

          {/* Volume & Queue - Right Side */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            {/* Volume Control */}
            {!isMobileDevice && (
              <div className="flex items-center gap-2">
                {volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-gray-400" />
                )}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${volume}%, #374151 ${volume}%, #374151 100%)`
                  }}
                />
              </div>
            )}

            {/* Mobile: Show volume indicator (read-only) */}
            {isMobileDevice && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Volume2 className="w-5 h-5" />
                <span>System Volume</span>
              </div>
            )}

            {/* Queue Button */}
            <button
              onClick={() => setShowQueue(!showQueue)}
              className="p-2 text-gray-400 hover:text-white transition-colors relative"
              title="Queue"
            >
              <List className="w-6 h-6" />
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {queue.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Styles for Range Input (Desktop Only) */}
      {!isMobileDevice && (
        <style>{`
          input[type='range']::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          
          input[type='range']::-moz-range-thumb {
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }

          input[type='range']::-webkit-slider-thumb:hover {
            transform: scale(1.2);
          }

          input[type='range']::-moz-range-thumb:hover {
            transform: scale(1.2);
          }
        `}</style>
      )}
    </div>
  );
};

export default Player;