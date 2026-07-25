import React, { useState, useEffect } from "react";
import { Story } from "../data/stories";
import { BookOpen, Award, CheckCircle2, Trash2, Plus, Sparkles } from "lucide-react";
import { isStoryDownloaded } from "../lib/offlineStorage";

const TikTokIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.887 2.892 2.892 0 0 1-2.892-2.887 2.896 2.896 0 0 1 2.892-2.888c.284 0 .556.042.813.118V9.33a6.326 6.326 0 0 0-.813-.053 6.337 6.337 0 0 0-6.33 6.336 6.337 6.337 0 0 0 6.33 6.336 6.337 6.337 0 0 0 6.33-6.336V8.653a8.192 8.192 0 0 0 4.788 1.516V6.724a4.832 4.832 0 0 1-1.007-.038z"/>
  </svg>
);

const getTikTokLink = (urlOrHandle?: string, authorName?: string) => {
  if (!urlOrHandle) {
    const handle = authorName?.toLowerCase().replace(/\s+/g, "") || "creator";
    return `https://www.tiktok.com/@${handle}`;
  }
  if (urlOrHandle.startsWith("http://") || urlOrHandle.startsWith("https://")) {
    return urlOrHandle;
  }
  return `https://www.tiktok.com/@${urlOrHandle.replace("@", "")}`;
};

interface BookSliderProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onDeleteStory?: (storyId: string, e: React.MouseEvent) => void;
  onOpenAddModal?: () => void;
}

export const BookSlider: React.FC<BookSliderProps> = ({ 
  stories, 
  onSelectStory, 
  onDeleteStory,
  onOpenAddModal
}) => {
  const [downloadedMap, setDownloadedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    const checkDownloads = async () => {
      const map: Record<string, boolean> = {};
      for (const s of stories) {
        map[s.id] = await isStoryDownloaded(s.id);
      }
      if (isMounted) setDownloadedMap(map);
    };
    checkDownloads();
    return () => { isMounted = false; };
  }, [stories]);

  return (
    <div id="new-noteworthy-section" className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-xl md:text-2xl font-black text-black flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            New & Noteworthy
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">Top trending audiobooks added this week</p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-white border-2 border-black rounded-full neo-shadow-sm">
          {stories.length} Audiobooks
        </span>
      </div>

      {/* Horizontal Scroll Area */}
      <div className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent -mx-6 px-6 snap-x">
        {stories.map((story) => {
          const isDownloaded = downloadedMap[story.id];
          return (
            <div
              id={`book-card-${story.id}`}
              key={story.id}
              onClick={() => onSelectStory(story)}
              className="flex-shrink-0 w-44 md:w-48 cursor-pointer group snap-start"
            >
              {/* Book Cover Container with Soft Neo-Brutalist shadow */}
              <div
                className="relative w-44 h-44 md:w-48 md:h-48 rounded-[28px] border-2 border-black overflow-hidden bg-white shadow-[4px_4px_0px_#000000] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[6px_6px_0px_#000000] transition-all duration-200"
                style={{ backgroundColor: story.accentColor }}
              >
                <img
                  src={story.coverUrl || "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600"}
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600";
                  }}
                  referrerPolicy="no-referrer"
                />
                
                {/* Category Pill Tag */}
                <div className="absolute bottom-3 left-3 bg-white border border-black px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-sm">
                  {story.category}
                </div>

                {/* Delete button overlay for custom / uploaded stories */}
                {onDeleteStory && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteStory(story.id, e);
                    }}
                    className="absolute top-2.5 left-2.5 z-20 p-1.5 bg-rose-500 hover:bg-rose-600 border border-black rounded-full text-white shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                    title="Futa Simulizi Hii Permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Offline Badge if downloaded */}
                {isDownloaded && (
                  <div className="absolute top-3 right-3 bg-green-100 border border-black px-2 py-0.5 rounded-full text-[9px] font-black text-green-900 flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3 h-3 text-green-700" />
                    Offline
                  </div>
                )}

                {/* Quick Play Overlay Button */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-[#FFF1C2] p-2.5 rounded-full border-2 border-black transform scale-90 group-hover:scale-100 transition-transform">
                    <span className="text-xs font-black px-1">LISTEN</span>
                  </div>
                </div>
              </div>

              {/* Book Metadata Details */}
              <div className="mt-3 px-1">
                <h4 className="font-display font-black text-sm text-black leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                  {story.title}
                </h4>
                <p className="text-xs text-gray-600 font-medium truncate mt-0.5">
                  By {story.author}
                </p>

                {/* TikTok Social Media Representation Badge */}
                <div className="mt-1">
                  <a
                    href={getTikTokLink(story.tiktokUrl, story.author)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-black hover:bg-neutral-800 text-white border border-black rounded-full text-[9px] font-black transition-all group/tt shadow-xs"
                    title={`Follow ${story.author} on TikTok`}
                  >
                    <TikTokIcon className="w-2.5 h-2.5 text-cyan-400 group-hover/tt:scale-110 transition-transform" />
                    <span className="truncate max-w-[65px] text-white">{story.creatorHandle || `@${story.author.replace(/\s+/g, "")}`}</span>
                    <span className="text-cyan-300 font-medium text-[8px]">• Follow him</span>
                  </a>
                </div>
                
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex items-center text-amber-500 text-xs font-bold">
                    ★ <span className="text-black ml-0.5 text-[11px]">{story.rating}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">•</span>
                  <span className="text-[10px] text-gray-500 font-semibold">{story.chapters.length} chapters</span>
                </div>
              </div>
            </div>
          );
        })}

        {stories.length === 0 && (
          <div className="w-full py-10 px-6 flex flex-col items-center justify-center border-2 border-dashed border-black rounded-3xl bg-white mx-2 text-center">
            <div className="w-12 h-12 bg-[#FFF1C2] border-2 border-black rounded-2xl flex items-center justify-center mb-3 text-amber-700">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <h4 className="font-display font-black text-sm text-black mb-1">
              Hakuna Simulizi Zilizopatikana
            </h4>
            <p className="text-xs text-gray-500 font-medium max-w-sm mb-4 leading-relaxed">
              Jaribu kubadilisha maneno ya utafutaji au ongeza kiungo cha simulizi mpya cha sauti.
            </p>

            {onOpenAddModal && (
              <button
                onClick={onOpenAddModal}
                className="px-4 py-2 bg-[#FFF1C2] hover:bg-[#ffe699] border-2 border-black rounded-xl font-black text-xs text-black neo-shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ongeza Kiungo (+ Add Link)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
