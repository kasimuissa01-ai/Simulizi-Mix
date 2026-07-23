import React from "react";
import { useAudio } from "../context/AudioContext";
import { Play, Pause, ChevronUp, BookOpen } from "lucide-react";

interface MiniPlayerProps {
  onExpand: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onExpand }) => {
  const { currentStory, currentChapter, isPlaying, currentTime, duration, togglePlay } = useAudio();

  if (!currentStory || !currentChapter) return null;

  const elapsedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      id="global-mini-player-bar"
      onClick={onExpand}
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 pb-4 pt-1 z-40"
    >
      {/* Neo-brutalist container */}
      <div className="bg-[#F7F4F0] border-2 border-black rounded-2xl p-3 shadow-[4px_4px_0px_#000000] cursor-pointer hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#000000] active:translate-y-0 active:shadow-[4px_4px_0px_#000000] transition-all relative overflow-hidden flex items-center justify-between gap-3">
        
        {/* Continuous progress indicator at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all duration-150"
            style={{ width: `${elapsedPercent}%` }}
          />
        </div>

        {/* Content left: Book cover and titles */}
        <div className="flex items-center gap-3 overflow-hidden flex-1 mt-1">
          <div
            className="w-11 h-11 rounded-lg border border-black overflow-hidden flex-shrink-0"
            style={{ backgroundColor: currentStory.accentColor }}
          >
            <img
              src={currentStory.coverUrl}
              alt={currentStory.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="overflow-hidden flex-1">
            <h4 className="font-display font-black text-xs text-black truncate leading-tight">
              {currentStory.title}
            </h4>
            <p className="font-mono text-[9px] font-bold text-gray-500 truncate mt-0.5">
              {currentChapter.title}
            </p>
          </div>
        </div>

        {/* Action controls right */}
        <div className="flex items-center gap-2 mt-1">
          {/* Play/Pause toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Avoid triggering expand
              togglePlay();
            }}
            className="w-9 h-9 rounded-full border-2 border-black bg-[#CCE4F5] hover:bg-[#a9d0eb] flex items-center justify-center transition-all cursor-pointer"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-black fill-black" />
            ) : (
              <Play className="w-4 h-4 text-black fill-black ml-0.5" />
            )}
          </button>

          {/* Expand indicator button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
            aria-label="Expand player"
          >
            <ChevronUp className="w-4 h-4 text-black animate-bounce" />
          </button>
        </div>
      </div>
    </div>
  );
};
