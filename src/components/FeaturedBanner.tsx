import React from "react";
import { Sparkles, Play } from "lucide-react";
import { Story } from "../data/stories";

interface FeaturedBannerProps {
  story?: Story | null;
  onExplore: (story: Story) => void;
}

export const FeaturedBanner: React.FC<FeaturedBannerProps> = ({ story, onExplore }) => {
  if (!story) return null;

  return (
    <div
      id="featured-trending-banner"
      onClick={() => onExplore(story)}
      className="mx-6 my-6 p-6 rounded-[28px] border-2 border-black bg-[#CCE4F5] flex flex-col md:flex-row items-center justify-between gap-6 neo-shadow cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000000] transition-all group"
    >
      {/* Graphic/Image Left */}
      <div className="flex items-center gap-5 w-full md:w-auto">
        <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl border-2 border-black overflow-hidden flex-shrink-0 bg-white neo-shadow-sm group-hover:rotate-1 transition-transform">
          <img
            src={story.coverUrl || "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600"}
            alt={story.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600";
            }}
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-2 left-2 bg-[#FFF1C2] border border-black text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
            <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
            LIVE
          </div>
        </div>

        <div>
          <div className="inline-block bg-[#FFF1C2] border border-black text-xs font-black px-2.5 py-0.5 rounded-full mb-2">
            TRENDING STORY
          </div>
          <h2 className="font-display text-xl md:text-2xl font-black text-black leading-tight group-hover:text-blue-700 transition-colors">
            {story.title}
          </h2>
          <p className="text-xs md:text-sm text-gray-700 mt-1 font-medium">
            Narrated by {story.narrator}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-sm font-bold text-amber-500">★</span>
            <span className="text-xs font-bold text-gray-800">{story.rating} Rating</span>
            <span className="text-xs text-gray-500">• {story.category}</span>
          </div>
        </div>
      </div>

      {/* Button Right */}
      <div className="w-full md:w-auto flex justify-end md:justify-start">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExplore(story);
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#FFF1C2] border-2 border-black font-extrabold text-sm neo-shadow-sm group-hover:-translate-y-1 group-hover:shadow-[4px_4px_0px_#000000] active:translate-y-0 active:shadow-none transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 text-black fill-black" />
          Listen Now
        </button>
      </div>
    </div>
  );
};
