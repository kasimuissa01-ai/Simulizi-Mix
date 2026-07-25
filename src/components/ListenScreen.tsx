import React, { useState, useEffect } from "react";
import { useAudio } from "../context/AudioContext";
import { Story } from "../data/stories";
import { 
  ChevronDown, 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  ListMusic, 
  Gauge, 
  Heart, 
  Share2, 
  BookOpen, 
  Volume2, 
  Check,
  Award,
  Download,
  CheckCircle2,
  Trash2,
  Loader2,
  WifiOff,
  Sparkles,
  UserCheck,
  Instagram,
  ExternalLink,
  Music,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { downloadStoryOffline, isStoryDownloaded, removeOfflineStory } from "../lib/offlineStorage";

const TikTokIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
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

const getInstagramLink = (urlOrHandle?: string, authorName?: string) => {
  if (!urlOrHandle) {
    const handle = authorName?.toLowerCase().replace(/\s+/g, "") || "creator";
    return `https://www.instagram.com/${handle}`;
  }
  if (urlOrHandle.startsWith("http://") || urlOrHandle.startsWith("https://")) {
    return urlOrHandle;
  }
  return `https://www.instagram.com/${urlOrHandle.replace("@", "")}`;
};

interface ListenScreenProps {
  onBack: () => void;
  favorites: string[];
  toggleFavorite: (storyId: string) => void;
  onDeleteStory?: (storyId: string) => void;
}

export const ListenScreen: React.FC<ListenScreenProps> = ({ onBack, favorites, toggleFavorite, onDeleteStory }) => {
  const {
    currentStory,
    currentChapter,
    currentChapterIndex,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    togglePlay,
    seek,
    nextChapter,
    prevChapter,
    skipSeconds,
    setSpeed,
    playStory
  } = useAudio();

  const [showChapterDrawer, setShowChapterDrawer] = useState(false);
  const [showSpeedPopover, setShowSpeedPopover] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Offline Download State
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (currentStory) {
      isStoryDownloaded(currentStory.id).then(setIsDownloaded);
    }
  }, [currentStory]);

  const handleDownloadToggle = async () => {
    if (!currentStory) return;

    if (isDownloaded) {
      if (window.confirm(`Futa "${currentStory.title}" kwenye hifadhi ya simu yako?`)) {
        await removeOfflineStory(currentStory);
        setIsDownloaded(false);
      }
    } else {
      setIsDownloading(true);
      setDownloadProgress(10);
      try {
        await downloadStoryOffline(currentStory, (percent) => {
          setDownloadProgress(percent);
        });
        setIsDownloaded(true);
      } catch (err) {
        alert("Pakua imefeli. Hakikisha intaneti ipo kisha jaribu tena.");
      } finally {
        setIsDownloading(false);
      }
    }
  };

  if (!currentStory || !currentChapter) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
        <BookOpen className="w-16 h-16 text-gray-400 mb-4 animate-pulse" />
        <p className="font-display text-xl font-bold">No Audiobook Selected</p>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">Select a story from the home catalog to begin listening!</p>
        <button
          onClick={onBack}
          className="mt-6 px-6 py-2.5 bg-[#CCE4F5] hover:bg-[#a5cfe8] border-2 border-black rounded-full font-bold cursor-pointer"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const isFavorited = favorites.includes(currentStory.id);

  // Time format helper
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const elapsedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seek(newTime);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const speeds = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  const creatorHandle = currentStory.creatorHandle || `@${currentStory.author.replace(/\s+/g, "")}`;
  const tiktokLink = getTikTokLink(currentStory.tiktokUrl, currentStory.author);
  const instagramLink = getInstagramLink(currentStory.instagramUrl, currentStory.author);

  return (
    <div id="listen-screen-viewport" className="w-full max-w-full px-4 sm:px-6 py-3 sm:py-4 flex flex-col h-full justify-between relative overflow-y-auto overflow-x-hidden scrollbar-none pb-28">
      {/* 1. Top Navigation */}
      <div className="flex items-center justify-between pb-2 flex-shrink-0 w-full gap-2">
        <button
          id="listen-back-btn"
          onClick={onBack}
          className="p-1.5 sm:p-2 bg-white border-2 border-black rounded-full hover:bg-gray-100 neo-shadow-sm active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex-shrink-0"
          aria-label="Back to home"
        >
          <ChevronDown className="w-5 h-5 text-black" />
        </button>
        
        <span className="font-display font-black text-[10px] sm:text-xs uppercase tracking-widest text-gray-500 truncate text-center px-1">
          Now Playing
        </span>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {onDeleteStory && (
            <button
              onClick={() => onDeleteStory(currentStory.id)}
              className="p-1.5 sm:p-2 bg-rose-100 hover:bg-rose-200 border-2 border-black rounded-full neo-shadow-sm text-rose-700 cursor-pointer transition-all active:translate-y-0.5 flex-shrink-0"
              title="Futa simulizi hii kabisa (Delete Permanently)"
              aria-label="Delete Story"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
            </button>
          )}

          <button
            onClick={() => toggleFavorite(currentStory.id)}
            className={`p-1.5 sm:p-2 border-2 border-black rounded-full cursor-pointer transition-all neo-shadow-sm flex-shrink-0 ${
              isFavorited ? "bg-[#FCE2E6] text-rose-500" : "bg-white text-black hover:bg-gray-100"
            }`}
            aria-label="Favorite"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? "fill-rose-500" : ""}`} />
          </button>
          
          <button
            onClick={handleShare}
            className="p-1.5 sm:p-2 bg-white border-2 border-black rounded-full hover:bg-gray-100 neo-shadow-sm cursor-pointer transition-all flex-shrink-0"
            aria-label="Share"
          >
            {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4 text-black" />}
          </button>
        </div>
      </div>

      {/* 2. Hero Cover Art */}
      <div className="my-1 sm:my-2 flex justify-center flex-shrink-0 w-full">
        <div
          id="listen-hero-cover"
          className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-[24px] border-4 border-black overflow-hidden neo-shadow-md"
          style={{ backgroundColor: currentStory.accentColor }}
        >
          <img
            src={currentStory.coverUrl || "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600"}
            alt={currentStory.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600";
            }}
            referrerPolicy="no-referrer"
          />
          
          <div className="absolute top-2.5 left-2.5 bg-white border-2 border-black px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 shadow-sm">
            <Volume2 className="w-3 h-3 text-blue-600" />
            AUDIOBOOK
          </div>
        </div>
      </div>

      {/* 3. Story Metadata */}
      <div id="listen-story-metadata" className="text-center px-1 flex-shrink-0 w-full">
        <h2 className="font-display text-xl sm:text-2xl font-black text-black leading-tight tracking-tight break-words line-clamp-2">
          {currentStory.title}
        </h2>
        <p className="text-xs text-gray-500 font-bold mt-0.5 max-w-[280px] mx-auto truncate">
          {currentStory.subtitle}
        </p>

        {/* Clean TikTok Social Badge */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <a
            href={tiktokLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-black hover:bg-neutral-800 text-white border-2 border-black rounded-full text-xs font-black neo-shadow-xs transition-all cursor-pointer active:translate-y-0.5 group"
            title={`Follow ${currentStory.author} on TikTok`}
          >
            <TikTokIcon className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>{creatorHandle}</span>
            <span className="text-[10px] text-cyan-300 font-semibold">• Follow him</span>
          </a>

          <button
            onClick={() => setShowCreatorModal(true)}
            className="p-1 bg-[#FFF1C2] hover:bg-[#ffe699] border-2 border-black rounded-full text-black neo-shadow-xs transition-all cursor-pointer active:translate-y-0.5"
            title="More author links & details"
          >
            <ExternalLink className="w-3.5 h-3.5 text-black" />
          </button>
        </div>

        {/* Offline Download Action */}
        <div className="mt-2 flex items-center justify-center">
          {isDownloading ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 border-2 border-black rounded-full text-xs font-bold text-amber-900">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
              <span>Inapakua Mzigo ({downloadProgress}%)</span>
            </div>
          ) : isDownloaded ? (
            <button
              onClick={handleDownloadToggle}
              className="flex items-center gap-1.5 px-3 py-1 bg-green-100 hover:bg-green-200 border-2 border-black rounded-full text-xs font-bold text-green-900 neo-shadow-xs transition-all cursor-pointer"
              title="Bonyeza kufuta masimulizi yaliyopakuliwa"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
              <span>Imepakuliwa (Offline Playback)</span>
              <Trash2 className="w-3 h-3 text-red-500 ml-1 hover:scale-110" />
            </button>
          ) : (
            <button
              onClick={handleDownloadToggle}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#CCE4F5] hover:bg-[#a9d1eb] border-2 border-black rounded-full text-xs font-black text-black neo-shadow-xs active:translate-y-0.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>Pakua Usikilize Bila Bando</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Audio Timeline / Progress Bar */}
      <div id="listen-audio-timeline" className="my-2 flex-shrink-0 w-full">
        <div className="relative">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSliderChange}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer border-2 border-black accent-black bg-gray-200"
            style={{
              background: `linear-gradient(to right, #CCE4F5 0%, #CCE4F5 ${elapsedPercent}%, #e5e7eb ${elapsedPercent}%, #e5e7eb 100%)`
            }}
          />
        </div>
        
        <div className="flex items-center justify-between mt-1 px-1 font-mono text-[10px] font-bold text-gray-600">
          <span>{formatTime(currentTime)}</span>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-black font-semibold truncate max-w-[120px]">
            {currentChapter.title.split(":")[0]}
          </span>
          <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
        </div>
      </div>

      {/* 5. Playback Controls */}
      <div id="listen-playback-controls" className="flex items-center justify-center gap-2 sm:gap-3 px-1 my-1 sm:my-2 flex-shrink-0 w-full">
        {/* Previous Chapter */}
        <button
          onClick={prevChapter}
          disabled={currentChapterIndex === 0}
          className="px-2.5 py-2 bg-white border-2 border-black rounded-full neo-shadow-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer transition-all text-[10px] font-display font-black flex-shrink-0"
          title="Previous Chapter"
        >
          PREV
        </button>

        {/* Skip Back 15s */}
        <button
          onClick={() => skipSeconds(-15)}
          className="p-2 sm:p-2.5 bg-white border-2 border-black rounded-full neo-shadow-sm hover:bg-gray-100 cursor-pointer active:translate-y-0.5 active:shadow-none transition-all relative flex-shrink-0"
          title="Skip Back 15s"
        >
          <RotateCcw className="w-4 h-4 text-black" />
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-black text-white text-[7px] font-mono font-bold px-0.5 rounded">15s</span>
        </button>

        {/* Oversized Play/Pause */}
        <button
          onClick={togglePlay}
          className="p-3.5 sm:p-4 bg-black text-white border-2 border-black rounded-full neo-shadow-md hover:bg-neutral-800 cursor-pointer active:translate-y-0.5 transition-all flex-shrink-0"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-white text-white" /> : <Play className="w-6 h-6 fill-white text-white ml-0.5" />}
        </button>

        {/* Skip Forward 15s */}
        <button
          onClick={() => skipSeconds(15)}
          className="p-2 sm:p-2.5 bg-white border-2 border-black rounded-full neo-shadow-sm hover:bg-gray-100 cursor-pointer active:translate-y-0.5 active:shadow-none transition-all relative flex-shrink-0"
          title="Skip Forward 15s"
        >
          <RotateCw className="w-4 h-4 text-black" />
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-black text-white text-[7px] font-mono font-bold px-0.5 rounded">15s</span>
        </button>

        {/* Next Chapter */}
        <button
          onClick={nextChapter}
          disabled={currentChapterIndex === currentStory.chapters.length - 1}
          className="px-2.5 py-2 bg-white border-2 border-black rounded-full neo-shadow-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer transition-all text-[10px] font-display font-black flex-shrink-0"
          title="Next Chapter"
        >
          NEXT
        </button>
      </div>

      {/* 6. Chapter & Speed Control Bar */}
      <div id="listen-utility-bar" className="flex items-center gap-2 flex-shrink-0 w-full my-1">
        {/* Chapter List trigger */}
        <button
          onClick={() => {
            setShowChapterDrawer(true);
            setShowSpeedPopover(false);
          }}
          className="flex-1 flex items-center justify-between px-3.5 py-2.5 bg-[#FFF1C2] border-2 border-black rounded-xl neo-shadow-xs hover:bg-[#ffeaa7] transition-all cursor-pointer text-left min-w-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ListMusic className="w-4 h-4 text-black flex-shrink-0" />
            <span className="font-mono text-xs font-bold truncate">
              {currentChapter.title}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-black flex-shrink-0 ml-1" />
        </button>

        {/* Speed Controller trigger */}
        <button
          onClick={() => setShowSpeedPopover(!showSpeedPopover)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-white border-2 border-black rounded-xl neo-shadow-xs hover:bg-gray-50 transition-all cursor-pointer font-bold text-xs"
        >
          <Gauge className="w-3.5 h-3.5 text-black" />
          <span>{playbackSpeed}x</span>
        </button>
      </div>


      {/* 8. Creator Spotlight Modal */}
      <AnimatePresence>
        {showCreatorModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreatorModal(false)}
              className="fixed inset-0 bg-black z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm bg-[#F7F4F0] border-4 border-black rounded-[28px] p-6 neo-shadow-lg relative overflow-hidden"
              >
                <button
                  onClick={() => setShowCreatorModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full border-2 border-black bg-white hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="text-center mb-4">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full border-4 border-black overflow-hidden neo-shadow-sm bg-[#FFF1C2]">
                    <img
                      src={currentStory.narratorAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250"}
                      alt={currentStory.author}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250";
                      }}
                    />
                  </div>
                  <h3 className="font-display font-black text-xl text-black flex items-center justify-center gap-1.5">
                    {currentStory.author}
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </h3>
                  <span className="inline-block mt-0.5 px-3 py-0.5 bg-[#CCE4F5] border border-black rounded-full font-mono font-bold text-xs text-blue-900">
                    {creatorHandle}
                  </span>
                </div>

                {/* Description Box in Modal */}
                <div className="p-3.5 bg-white border-2 border-black rounded-2xl mb-4 text-xs text-gray-800 font-medium leading-relaxed shadow-sm">
                  "Original story created by <strong className="font-black text-black">{currentStory.author}</strong>. Show them love on their official channels below!"
                </div>

                <div className="space-y-2">
                  <a
                    href={tiktokLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3 bg-black text-white border-2 border-black rounded-xl font-black text-xs neo-shadow-xs hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <TikTokIcon className="w-4 h-4 text-cyan-400" />
                      <span>Follow on TikTok</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-300" />
                  </a>

                  <a
                    href={instagramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3 bg-[#FFF1C2] text-black border-2 border-black rounded-xl font-black text-xs neo-shadow-xs hover:bg-[#ffe699] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      <span>Follow on Instagram</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-black" />
                  </a>

                  <button
                    onClick={() => {
                      togglePlay();
                      setShowCreatorModal(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-[#CCE4F5] text-black border-2 border-black rounded-xl font-black text-xs neo-shadow-xs hover:bg-[#a3cfe0] transition-all cursor-pointer"
                  >
                    <Music className="w-4 h-4 text-blue-800" />
                    <span>{isPlaying ? "Continue Listening" : "🎵 Listen Now"}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* 7. Chapter List Drawer */}
      <AnimatePresence>
        {showChapterDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChapterDrawer(false)}
              className="fixed inset-0 bg-black z-40"
            />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#F7F4F0] border-t-4 border-l-2 border-r-2 border-black rounded-t-[28px] z-50 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
                <h3 className="font-display text-lg font-black text-black">Chapters List</h3>
                <span className="font-mono text-[11px] font-bold text-gray-500">{currentStory.chapters.length} segments</span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {currentStory.chapters.map((ch, idx) => {
                  const isChActive = idx === currentChapterIndex;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        playStory(currentStory, idx);
                        setShowChapterDrawer(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl border-2 border-black flex items-center justify-between transition-all cursor-pointer ${
                        isChActive
                          ? "bg-[#CCE4F5] neo-shadow-sm translate-y-[-1px]"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className={`font-mono text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border border-black ${
                          isChActive ? "bg-white" : "bg-gray-100"
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-sans text-xs font-bold text-black truncate">
                          {ch.title}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-gray-500">
                          {ch.duration}
                        </span>
                        {isChActive && isPlaying && (
                          <div className="flex gap-0.5 items-end h-3">
                            <span className="w-1 bg-black animate-[bounce_0.8s_infinite] h-2"></span>
                            <span className="w-1 bg-black animate-[bounce_0.8s_infinite_0.2s] h-3"></span>
                            <span className="w-1 bg-black animate-[bounce_0.8s_infinite_0.4s] h-1.5"></span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowChapterDrawer(false)}
                className="w-full mt-4 py-2.5 rounded-full bg-white hover:bg-gray-50 border-2 border-black font-extrabold text-xs text-center cursor-pointer transition-all"
              >
                Close List
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 8. Speed Controller Popover */}
      <AnimatePresence>
        {showSpeedPopover && (
          <>
            <div
              onClick={() => setShowSpeedPopover(false)}
              className="fixed inset-0 z-30"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="absolute bottom-20 right-6 bg-[#F7F4F0] border-2 border-black rounded-2xl p-3 shadow-lg z-40 w-44"
            >
              <h4 className="font-display font-black text-[10px] uppercase tracking-wider text-gray-400 mb-2 px-1">
                Narration Speed
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {speeds.map((s) => {
                  const isActive = playbackSpeed === s;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setSpeed(s);
                        setShowSpeedPopover(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                        isActive
                          ? "bg-[#FFF1C2] border-black shadow-[2px_2px_0px_#000000]"
                          : "bg-white border-gray-200 hover:border-black"
                      }`}
                    >
                      {s.toFixed(2)}x
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
