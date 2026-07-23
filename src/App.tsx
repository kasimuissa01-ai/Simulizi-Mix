import React, { useState, useEffect, useRef } from "react";
import { STORIES, Story, FEATURED_STORY } from "./data/stories";
import { AudioProvider, useAudio } from "./context/AudioContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Header } from "./components/Header";
import { FeaturedBanner } from "./components/FeaturedBanner";
import { BookSlider } from "./components/BookSlider";
import { AuthorsSection } from "./components/AuthorsSection";
import { ListenScreen } from "./components/ListenScreen";
import { MiniPlayer } from "./components/MiniPlayer";
import { 
  Sparkles, 
  Heart, 
  Edit2, 
  Check, 
  BookOpen, 
  Smile,
  Volume2,
  Trash2,
  Plus,
  X,
  FileAudio,
  UploadCloud,
  FileText,
  Loader2,
  WifiOff,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { uploadToSupabase, getSupabaseClient } from "./lib/supabase";
import { getOfflineStories, removeOfflineStory } from "./lib/offlineStorage";
import { isVideoFile, extractAudioFromVideo, formatFileSize } from "./lib/audioExtractor";

const PRESET_COVERS = [
  {
    name: "Classic Book",
    url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Campfire Night",
    url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Cosmic Stars",
    url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Safari Sunset",
    url: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "African Art",
    url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Old Parchment",
    url: "https://images.unsplash.com/photo-1463171359979-300627eb663e?auto=format&fit=crop&q=80&w=600"
  }
];

function cleanStoryTitle(rawName: string): string {
  if (!rawName) return "Simulizi Mpya";
  
  let name = rawName.trim();
  if (name.includes("/")) {
    name = name.split("/").pop()?.split("?")[0] || name;
  }

  // Remove file extensions
  name = name.replace(/\.(mp4|mp3|wav|m4a|aac|ogg|webm|mov|avi|mkv)$/i, "");

  // Clean up underscores, hyphens, extra spaces into clean readable words
  name = name.replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();

  // Capitalize words
  if (name) {
    return name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return "Simulizi Mpya";
}

function MainApp() {
  const { currentStory, playStory } = useAudio();
  const { user, userProfile, updateFavoritesInCloud, addCustomStoryToCloud, deleteCustomStoryFromCloud } = useAuth();
  
  // Navigation & Filter States
  const [activeScreen, setActiveScreen] = useState<"home" | "listen">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  
  // Stories list state merging built-in with custom ones (synchronized with either Firestore or localStorage)
  const [allStories, setAllStories] = useState<Story[]>(STORIES);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTitle, setImportTitle] = useState("");
  const [importSubtitle, setImportSubtitle] = useState("");
  const [importAuthor, setImportAuthor] = useState("");
  const [importCreatorHandle, setImportCreatorHandle] = useState("");
  const [importTiktok, setImportTiktok] = useState("");
  const [importInstagram, setImportInstagram] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importCover, setImportCover] = useState("");
  const [importCategory, setImportCategory] = useState("Fiction");

  // Drag-and-drop upload states
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [extractionStatus, setExtractionStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>([]);

  // User name customization state
  const [userName, setUserName] = useState("Amina");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  // Filter for Favorites Only state
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);

  // Offline Downloaded Stories state
  const [showOnlyOffline, setShowOnlyOffline] = useState(false);
  const [offlineStoryIds, setOfflineStoryIds] = useState<string[]>([]);

  useEffect(() => {
    getOfflineStories().then((items) => {
      setOfflineStoryIds(items.map((i) => i.storyId));
    });
  }, [activeScreen, showOnlyOffline]);

  // Sync state with cloud profile (Firestore) if logged in, or localstorage if logged out
  useEffect(() => {
    if (user && userProfile) {
      setAllStories([...STORIES, ...userProfile.customStories]);
      setFavorites(userProfile.favorites || []);
      setUserName(userProfile.displayName || "Avid Listener");
      setTempName(userProfile.displayName || "Avid Listener");
    } else {
      // Load from localStorage
      const savedStories = localStorage.getItem("simulizi_custom_stories");
      const customLocal: Story[] = savedStories ? JSON.parse(savedStories) : [];
      setAllStories([...STORIES, ...customLocal]);

      const savedFavs = localStorage.getItem("simulizi_favs");
      setFavorites(savedFavs ? JSON.parse(savedFavs) : []);

      const savedName = localStorage.getItem("simulizi_user");
      setUserName(savedName || "Amina");
      setTempName(savedName || "Amina");
    }
  }, [user, userProfile]);

  // Persist local favorites if logged out
  useEffect(() => {
    if (!user) {
      localStorage.setItem("simulizi_favs", JSON.stringify(favorites));
    }
  }, [favorites, user]);

  const toggleFavorite = async (storyId: string) => {
    const updatedFavs = favorites.includes(storyId)
      ? favorites.filter(id => id !== storyId)
      : [...favorites, storyId];

    setFavorites(updatedFavs);

    if (user) {
      try {
        await updateFavoritesInCloud(updatedFavs);
      } catch (err) {
        console.error("Cloud favorites sync failed", err);
      }
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName);
      if (!user) {
        localStorage.setItem("simulizi_user", tempName);
      }
    }
    setIsEditingName(false);
  };

  // Sync browser & phone native back button history
  useEffect(() => {
    // Ensure initial history state is set
    if (!window.history.state) {
      window.history.replaceState({ screen: "home" }, "");
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;

      // Close modal on back if open
      setIsImportModalOpen(false);

      if (state && state.screen === "listen") {
        setActiveScreen("listen");
      } else {
        setActiveScreen("home");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSelectStory = (story: Story) => {
    playStory(story, 0); // Start chapter 1
    if (activeScreen !== "listen") {
      window.history.pushState({ screen: "listen", storyId: story.id }, "");
      setActiveScreen("listen");
    }
  };

  const handleBackToHome = () => {
    if (window.history.state && window.history.state.screen === "listen") {
      window.history.back();
    } else {
      setActiveScreen("home");
    }
  };

  const handleRemoveOfflineStory = async (story: Story, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Unataka kufuta "${story.title}" kwenye hifadhi ya simu yako (Offline)?`)) {
      await removeOfflineStory(story);
      const updated = await getOfflineStories();
      setOfflineStoryIds(updated.map((i) => i.storyId));
    }
  };

  const handleOpenImportModal = () => {
    window.history.pushState({ modal: "import", screen: activeScreen }, "");
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    if (window.history.state && window.history.state.modal === "import") {
      window.history.back();
    } else {
      setIsImportModalOpen(false);
    }
  };

  // Add Custom Link / Video-Audio Storytelling Link
  const handleImportStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTitle.trim() || !importUrl) return;

    const formattedTitle = importTitle.trim();
    const handleVal = importCreatorHandle.trim();
    const formattedCreatorHandle = handleVal
      ? (handleVal.startsWith("@") ? handleVal : `@${handleVal}`)
      : `@${(importAuthor || "Kendrick").replace(/\s+/g, "")}`;

    const newStoryId = `custom-${Date.now()}`;
    const newStory: Story = {
      id: newStoryId,
      title: formattedTitle,
      subtitle: importSubtitle || "Audio Storytelling Stream",
      author: importAuthor || "Kendrick",
      creatorHandle: formattedCreatorHandle,
      tiktokUrl: importTiktok.trim(),
      instagramUrl: importInstagram.trim(),
      narrator: importAuthor || "Kendrick",
      category: importCategory,
      rating: 5.0,
      description: "Direct link storytelling audio stream, playing on the soft neo-brutalist player.",
      coverUrl: importCover || "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600",
      accentColor: ["#CCE4F5", "#FFF1C2", "#FCE2E6"][Math.floor(Math.random() * 3)],
      narratorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
      chapters: [
        {
          id: 1,
          title: `Sura ya 1: ${formattedTitle}`,
          duration: "Full Track",
          durationSeconds: 0,
          audioUrl: importUrl
        }
      ]
    };

    if (user) {
      // Sync straight to Cloud Firestore
      try {
        await addCustomStoryToCloud(newStory);
      } catch (err) {
        console.error("Failed to add custom story to Cloud Firestore", err);
      }
    } else {
      // Save locally to LocalStorage
      const saved = localStorage.getItem("simulizi_custom_stories");
      const customList: Story[] = saved ? JSON.parse(saved) : [];
      const updatedCustomList = [...customList, newStory];
      localStorage.setItem("simulizi_custom_stories", JSON.stringify(updatedCustomList));
      setAllStories([...STORIES, ...updatedCustomList]);
    }

    // Reset Inputs & Close Modal
    setImportTitle("");
    setImportSubtitle("");
    setImportAuthor("");
    setImportCreatorHandle("");
    setImportTiktok("");
    setImportInstagram("");
    setImportUrl("");
    setImportCover("");
    setUploadSuccess("");
    setUploadError("");
    setIsImportModalOpen(false);

    // Auto-play newly imported feed!
    handleSelectStory(newStory);
  };

  const handleDeleteCustomStory = async (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (user) {
      try {
        await deleteCustomStoryFromCloud(storyId);
      } catch (err) {
        console.error("Cloud custom story deletion failed", err);
      }
    } else {
      const saved = localStorage.getItem("simulizi_custom_stories");
      if (!saved) return;
      const customList: Story[] = JSON.parse(saved);
      const updatedCustomList = customList.filter(s => s.id !== storyId);
      localStorage.setItem("simulizi_custom_stories", JSON.stringify(updatedCustomList));
      setAllStories([...STORIES, ...updatedCustomList]);
    }
    setFavorites(prev => prev.filter(id => id !== storyId));
  };

  // Drag and Drop Logic
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError("");
    setUploadSuccess("");

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    setUploadSuccess("");
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFileUpload(files[0]);
    }
  };

  const processFileUpload = async (file: File) => {
    // Check if Supabase client is initialized
    const client = getSupabaseClient();
    if (!client) {
      setUploadError("Supabase Storage is not connected. Enter credentials in Profile Settings (top-right profile icon).");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setUploadSuccess("");
    setExtractionStatus("");

    try {
      let fileToUpload = file;
      let isExtracted = false;
      let statsMessage = "";

      // Automatic video-to-audio extraction
      if (isVideoFile(file)) {
        setExtractionStatus("🎬 Video detected! Automatically extracting audio track...");
        const result = await extractAudioFromVideo(file, (msg) => {
          setExtractionStatus(`🎬 ${msg}`);
        });
        fileToUpload = result.audioFile;
        isExtracted = true;
        statsMessage = `(Saved ${result.savedPercent}% bandwidth: ${formatFileSize(result.originalSize)} video ➔ ${formatFileSize(result.newSize)} audio)`;
      }

      setExtractionStatus("Uploading audio track to Supabase Storage...");
      const uploadedUrl = await uploadToSupabase(fileToUpload);
      setImportUrl(uploadedUrl);
      
      const defaultName = isExtracted ? file.name : fileToUpload.name;
      if (!importTitle.trim()) {
        const cleaned = cleanStoryTitle(defaultName);
        setImportTitle(cleaned);
        setUploadSuccess(`🎉 ${isExtracted ? "Video audio extracted" : "Audio"} source "${cleaned}" uploaded to Supabase! ${statsMessage}`);
      } else {
        setUploadSuccess(`🎉 ${isExtracted ? "Video audio extracted" : "Audio file"} uploaded successfully for "${importTitle}"! ${statsMessage}`);
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Upload failed. Verify Supabase bucket and permissions.");
    } finally {
      setIsUploading(false);
      setExtractionStatus("");
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    setUploadSuccess("");
    const files = e.target.files;
    if (files && files.length > 0) {
      await processImageUpload(files[0]);
    }
  };

  const processImageUpload = async (file: File) => {
    const client = getSupabaseClient();
    if (!client) {
      setUploadError("Supabase Storage is not connected. Enter credentials in Profile Settings (top-right profile icon).");
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadToSupabase(file);
      setImportCover(uploadedUrl);
      setUploadSuccess(`🎉 Cover image uploaded successfully to Supabase!`);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Cover image upload failed. Verify Supabase bucket and permissions.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const categories = ["All", "Simulizi", "Audiobook", "Drama", "Self-Help", "Fiction"];

  // Featured Story calculation: prioritize uploaded custom story if available, otherwise first story
  const featuredTrendingStory = allStories.find(s => s.id.startsWith("custom-")) || allStories[0] || STORIES[0];

  // Compute filtered catalog
  const filteredStories = allStories.filter((story) => {
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.narrator.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory =
      selectedCategory === "All" || story.category === selectedCategory;

    const matchesAuthor =
      !selectedAuthor || story.narrator === selectedAuthor;

    const matchesFav = !showOnlyFavs || favorites.includes(story.id);

    const matchesOffline = !showOnlyOffline || offlineStoryIds.includes(story.id);

    return matchesSearch && matchesCategory && matchesAuthor && matchesFav && matchesOffline;
  });

  return (
    <div id="app-container" className="min-h-screen bg-[#E5E2DD] flex justify-center py-0 sm:py-6 font-sans items-center">
      {/* Phone/App Viewport Wrapper */}
      <div 
        id="phone-viewport"
        className="w-full max-w-md bg-[#F7F4F0] h-screen sm:h-[840px] sm:max-h-[92vh] sm:rounded-[36px] sm:border-4 sm:border-black flex flex-col relative overflow-hidden shadow-[8px_8px_0px_#000000]"
      >
        <AnimatePresence mode="wait">
          {activeScreen === "home" ? (
            <motion.div
              key="home-screen"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full overflow-hidden"
            >
              {/* Header */}
              <Header 
                searchQuery={searchQuery} 
                onSearchChange={setSearchQuery} 
                onSelectOffline={() => {
                  setShowOnlyOffline(true);
                  setShowOnlyFavs(false);
                  setSelectedCategory("All");
                }}
              />

              {/* Scrollable Main Content Container */}
              <div className="flex-1 overflow-y-auto pb-28 scrollbar-none flex flex-col">
                {/* Home Greeting */}
                <div id="greeting-section" className="px-6 pt-6 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isEditingName ? (
                        <div className="flex items-center gap-1 bg-white border-2 border-black rounded-full px-3 py-1">
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="font-display font-black text-lg bg-transparent border-none outline-none text-black w-28"
                            maxLength={12}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveName}
                            className="p-1 text-green-600 hover:bg-gray-100 rounded-full cursor-pointer"
                            aria-label="Save Name"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <h1 className="font-display text-2xl md:text-3xl font-black text-black">
                            Hello, {userName}!
                          </h1>
                          <button
                            onClick={() => {
                              setTempName(userName);
                              setIsEditingName(true);
                            }}
                            className="p-1 hover:bg-[#FFF1C2] border border-transparent hover:border-black rounded-lg transition-all cursor-pointer"
                            aria-label="Edit Name"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-gray-500 hover:text-black" />
                          </button>
                        </div>
                      )}
                      <Smile className="w-6 h-6 text-yellow-500 fill-yellow-200" />
                    </div>

                    {/* Elegant Button to Import Link */}
                    <button
                      onClick={handleOpenImportModal}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CCE4F5] hover:bg-[#a9d0eb] border-2 border-black rounded-full font-black text-xs neo-shadow-sm cursor-pointer transition-all hover:translate-y-[-1px]"
                      title="Import direct link"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Link
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 font-semibold leading-tight">
                    Which story do you want to listen to today?
                  </p>
                </div>

                {/* Featured Banner / Quick Trending (Only show if not filtering heavily) */}
                {!searchQuery && !selectedAuthor && selectedCategory === "All" && !showOnlyFavs && !showOnlyOffline && (
                  <FeaturedBanner 
                    story={featuredTrendingStory} 
                    onExplore={handleSelectStory} 
                  />
                )}

                {/* Category Toggles (Pill style, Soft Neo-Brutalist) */}
                <div id="category-chips-section" className="px-6 py-4">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {categories.map((cat) => {
                      const isCatActive = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setShowOnlyFavs(false); // Reset fav only toggler
                            setShowOnlyOffline(false);
                          }}
                          className={`px-4 py-2 rounded-full border-2 border-black font-extrabold text-xs transition-all cursor-pointer flex-shrink-0 ${
                            isCatActive && !showOnlyFavs && !showOnlyOffline
                              ? "bg-[#FFF1C2] neo-shadow-sm translate-y-[-1px]"
                              : "bg-white hover:bg-gray-50 hover:shadow-sm"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                    
                    {/* Favorites Toggle Button */}
                    <button
                      onClick={() => {
                        setShowOnlyFavs(!showOnlyFavs);
                        setShowOnlyOffline(false);
                        setSelectedCategory("All");
                      }}
                      className={`px-4 py-2 rounded-full border-2 border-black font-extrabold text-xs transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                        showOnlyFavs
                          ? "bg-[#FCE2E6] text-rose-500 neo-shadow-sm translate-y-[-1px]"
                          : "bg-white text-black hover:bg-gray-50 hover:shadow-sm"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${showOnlyFavs ? "fill-rose-500" : ""}`} />
                      Favorites ({favorites.length})
                    </button>

                    {/* Offline Downloaded Filter Toggle */}
                    <button
                      onClick={() => {
                        setShowOnlyOffline(!showOnlyOffline);
                        setShowOnlyFavs(false);
                        setSelectedCategory("All");
                      }}
                      className={`px-4 py-2 rounded-full border-2 border-black font-extrabold text-xs transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                        showOnlyOffline
                          ? "bg-[#CCE4F5] text-blue-900 neo-shadow-sm translate-y-[-1px]"
                          : "bg-white text-black hover:bg-gray-50 hover:shadow-sm"
                      }`}
                    >
                      <WifiOff className="w-3.5 h-3.5 text-blue-700" />
                      Offline ({offlineStoryIds.length})
                    </button>
                  </div>
                </div>

                {/* Dedicated Offline Downloaded Stories View */}
                {showOnlyOffline ? (
                  <div className="px-6 py-2">
                    <div className="p-4 bg-[#CCE4F5] border-2 border-black rounded-2xl mb-4 neo-shadow-sm flex items-center justify-between">
                      <div>
                        <h3 className="font-display font-black text-base text-blue-950 flex items-center gap-2">
                          <WifiOff className="w-5 h-5 text-blue-800" />
                          Maktaba ya Offline
                        </h3>
                        <p className="text-xs text-blue-900 font-medium mt-0.5">
                          Masimulizi uliyohifadhi kwa matumizi ya bila mtandao/data
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-white border border-black rounded-full font-black text-xs text-blue-900 flex-shrink-0">
                        {offlineStoryIds.length} Saved
                      </span>
                    </div>

                    {filteredStories.length === 0 ? (
                      <div className="p-6 bg-white border-2 border-black rounded-3xl text-center shadow-sm my-2">
                        <div className="w-12 h-12 bg-[#FFF1C2] border-2 border-black rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Download className="w-6 h-6 text-black" />
                        </div>
                        <h4 className="font-display font-black text-sm text-black mb-1">
                          Hakuna Simulizi Zilizopakuliwa Bado
                        </h4>
                        <p className="text-xs text-gray-600 font-medium mb-4 leading-relaxed max-w-xs mx-auto">
                          Sikiliza simulizi uipendayo mahali popote bila mtandao (data)! Fungua simulizi yoyote kisha ubonyeze batani ya Pakua (Download) kwenye player ili uweze kusikiliza offline wakati wowote.
                        </p>
                        <button
                          onClick={() => setShowOnlyOffline(false)}
                          className="px-5 py-2.5 bg-[#FFF1C2] hover:bg-[#ffe699] border-2 border-black rounded-full font-black text-xs neo-shadow-xs cursor-pointer transition-all active:translate-y-0.5"
                        >
                          Vinjari Simulizi Zote
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5 mb-4">
                        {filteredStories.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => handleSelectStory(s)}
                            className="p-3 bg-white border-2 border-black rounded-2xl flex items-center justify-between cursor-pointer hover:bg-blue-50/50 transition-all neo-shadow-xs group"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <img
                                src={s.coverUrl}
                                alt={s.title}
                                className="w-12 h-12 object-cover rounded-xl border-2 border-black flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="overflow-hidden">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="px-2 py-0.5 bg-green-100 text-green-800 border border-black rounded-md text-[9px] font-black flex items-center gap-1">
                                    ✓ Offline Ready
                                  </span>
                                </div>
                                <h5 className="font-bold text-xs text-black truncate group-hover:text-blue-600 transition-colors">{s.title}</h5>
                                <p className="text-[10px] text-gray-500 truncate">By {s.author} • {s.chapters.length} chapters</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={(e) => handleRemoveOfflineStory(s, e)}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-black transition-all cursor-pointer"
                                title="Futa kwenye Offline"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Book Slider Catalog */}
                    <div className="relative">
                      <BookSlider 
                        stories={filteredStories} 
                        onSelectStory={handleSelectStory} 
                      />
                      {/* Custom Delete badge overlays for custom stories */}
                      {filteredStories.some(s => s.id.startsWith("custom-")) && (
                        <div className="px-6 -mt-3 mb-4 text-[10px] font-mono text-gray-500 flex items-center gap-1">
                          <span>* Click your imported custom stories below to stream and listen.</span>
                        </div>
                      )}
                    </div>

                    {/* If custom stories exist, show a dedicated section to manage/delete them */}
                    {allStories.some(s => s.id.startsWith("custom-")) && (
                      <div className="px-6 py-2">
                        <h4 className="font-display font-black text-sm text-black mb-2 flex items-center gap-1.5">
                          <FileAudio className="w-4 h-4 text-blue-600" />
                          Your Cloud Library
                        </h4>
                        <div className="space-y-2">
                          {allStories.filter(s => s.id.startsWith("custom-")).map(s => (
                            <div 
                              key={s.id} 
                              onClick={() => handleSelectStory(s)}
                              className="p-2.5 bg-white border-2 border-black rounded-xl flex items-center justify-between cursor-pointer hover:bg-blue-50/40 transition-colors"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <img src={s.coverUrl} className="w-10 h-10 object-cover rounded-lg border border-black" referrerPolicy="no-referrer" />
                                <div className="overflow-hidden">
                                  <h5 className="font-bold text-xs text-black truncate">{s.title}</h5>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-gray-500 truncate">By {s.author}</span>
                                    <a
                                      href={s.tiktokUrl ? (s.tiktokUrl.startsWith("http") ? s.tiktokUrl : `https://www.tiktok.com/@${s.tiktokUrl.replace("@", "")}`) : `https://www.tiktok.com/@${s.author.toLowerCase().replace(/\s+/g, "")}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-black hover:bg-neutral-800 text-white rounded-full text-[9px] font-black transition-all"
                                      title={`Follow ${s.author} on TikTok`}
                                    >
                                      <svg className="w-2.5 h-2.5 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.887 2.892 2.892 0 0 1-2.892-2.887 2.896 2.896 0 0 1 2.892-2.888c.284 0 .556.042.813.118V9.33a6.326 6.326 0 0 0-.813-.053 6.337 6.337 0 0 0-6.33 6.336 6.337 6.337 0 0 0 6.33 6.336 6.337 6.337 0 0 0 6.33-6.336V8.653a8.192 8.192 0 0 0 4.788 1.516V6.724a4.832 4.832 0 0 1-1.007-.038z"/>
                                      </svg>
                                      <span>{s.creatorHandle || `@${s.author.replace(/\s+/g, "")}`}</span>
                                      <span className="text-cyan-300 font-normal text-[8px]">• Follow him</span>
                                    </a>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={(e) => handleDeleteCustomStory(s.id, e)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-black transition-all cursor-pointer"
                                title="Remove Imported Feed"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Authors Section */}
                    <AuthorsSection 
                      selectedAuthor={selectedAuthor} 
                      onSelectAuthor={setSelectedAuthor} 
                    />
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="listen-screen"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="h-full flex flex-col overflow-hidden"
            >
              <ListenScreen 
                onBack={handleBackToHome} 
                favorites={favorites}
                toggleFavorite={toggleFavorite}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Persistent Global Mini-Player Overlay */}
        {currentStory && activeScreen === "home" && (
          <MiniPlayer onExpand={() => {
            if (activeScreen !== "listen") {
              window.history.pushState({ screen: "listen" }, "");
              setActiveScreen("listen");
            }
          }} />
        )}

        {/* Hybrid Link / Direct File Upload Importer Modal */}
        <AnimatePresence>
          {isImportModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseImportModal}
                className="fixed inset-0 bg-black z-50"
              />
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-sm bg-[#F7F4F0] border-4 border-black rounded-[28px] p-6 neo-shadow-lg relative overflow-y-auto max-h-[90vh] scrollbar-none"
                >
                  <button
                    onClick={handleCloseImportModal}
                    className="absolute top-4 right-4 p-1.5 rounded-full border-2 border-black bg-white hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <h3 className="font-display text-lg font-black text-black mb-1 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Upload & Play Story
                  </h3>
                  <p className="text-xs text-gray-600 mb-3.5 font-medium leading-normal">
                    {user ? "Store directly in Supabase Storage and sync coordinates with Cloud Firestore." : "Add streaming links or drag files to host. Connect Supabase via Profile Settings to enable file hosting."}
                  </p>

                  {/* HTML File Upload Drop Zone (Flexible User Experience: Drag-and-Drop + Click Selection) */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-5 mb-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging 
                        ? "border-[#3b82f6] bg-blue-50" 
                        : "border-black bg-white hover:bg-gray-50/50"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="audio/*,video/*"
                      className="hidden"
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="text-xs font-black text-blue-600 text-center px-2">
                          {extractionStatus || "Uploading to Supabase Storage..."}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <UploadCloud className="w-8 h-8 text-gray-500" />
                        <p className="text-xs font-extrabold text-black">Drag & drop audio or video file here</p>
                        <p className="text-[10px] text-gray-600 font-medium">
                          ⚡ Videos automatically converted to audio to save 90%+ storage!
                        </p>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <div className="p-2.5 mb-3.5 bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl text-[11px] font-semibold flex items-start gap-1.5">
                      <span className="leading-tight">{uploadError}</span>
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="p-2.5 mb-3.5 bg-green-50 border-2 border-green-400 text-green-700 rounded-xl text-[11px] font-semibold flex items-start gap-1.5">
                      <span className="leading-tight">{uploadSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleImportStory} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Story Title *</label>
                      <input
                        type="text"
                        required
                        value={importTitle}
                        onChange={(e) => setImportTitle(e.target.value)}
                        placeholder="e.g. Tanzanian Folk Legend"
                        className="w-full px-4 py-2 text-xs rounded-xl border-2 border-black bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Author / Creator Name</label>
                      <input
                        type="text"
                        value={importAuthor}
                        onChange={(e) => setImportAuthor(e.target.value)}
                        placeholder="e.g. Kendrick"
                        className="w-full px-4 py-2 text-xs rounded-xl border-2 border-black bg-white focus:outline-none"
                      />
                    </div>

                    {/* Social Media & Writer Attribution Section */}
                    <div className="p-3 bg-[#FCE2E6] border-2 border-black rounded-2xl space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-rose-900 flex items-center gap-1">
                        <span>✨ Writer Socials & Attribution</span>
                      </p>

                      <div>
                        <label className="block text-[9px] font-black uppercase text-gray-700 mb-0.5">Creator Handle (e.g. @Kendrick)</label>
                        <input
                          type="text"
                          value={importCreatorHandle}
                          onChange={(e) => setImportCreatorHandle(e.target.value)}
                          placeholder="@KendrickOfficial"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border-2 border-black bg-white focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-black uppercase text-gray-700 mb-0.5">TikTok Username / Link</label>
                          <input
                            type="text"
                            value={importTiktok}
                            onChange={(e) => setImportTiktok(e.target.value)}
                            placeholder="@Kendrick or URL"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border-2 border-black bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black uppercase text-gray-700 mb-0.5">Instagram Username / Link</label>
                          <input
                            type="text"
                            value={importInstagram}
                            onChange={(e) => setImportInstagram(e.target.value)}
                            placeholder="@Kendrick or URL"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border-2 border-black bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Stream Link / URL *</label>
                      <input
                        type="url"
                        required
                        value={importUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setImportUrl(val);
                          if (val && !importTitle.trim()) {
                            setImportTitle(cleanStoryTitle(val));
                          }
                        }}
                        placeholder="e.g. Paste direct link or upload above..."
                        className="w-full px-4 py-2 text-xs rounded-xl border-2 border-black bg-white focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1.5">Cover Image (Optional)</label>
                      
                      {importCover ? (
                        <div className="relative rounded-2xl border-2 border-black overflow-hidden mb-3 group bg-white p-2 flex items-center gap-3">
                          <img 
                            src={importCover} 
                            className="w-16 h-16 object-cover rounded-xl border border-black flex-shrink-0" 
                            referrerPolicy="no-referrer" 
                            alt="Cover Preview"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-mono text-gray-500 truncate">{importCover}</p>
                            <p className="text-[11px] font-bold text-green-600 flex items-center gap-1 mt-0.5">
                              <Check className="w-3.5 h-3.5" /> Selected Cover
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setImportCover("")}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-black rounded-lg transition-all"
                            title="Remove cover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* File input for Gallery Upload */}
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              ref={imageInputRef}
                              onChange={handleImageSelect}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              disabled={isUploadingImage}
                              onClick={() => imageInputRef.current?.click()}
                              className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 border-2 border-black rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all neo-shadow-xs active:translate-y-0.5 active:shadow-none cursor-pointer"
                            >
                              {isUploadingImage ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                  <span>Uploading Cover...</span>
                                </>
                              ) : (
                                <>
                                  <UploadCloud className="w-4 h-4 text-blue-600" />
                                  <span>Upload Cover from Gallery</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Preset Gallery */}
                          <div>
                            <p className="text-[10px] font-bold text-gray-600 mb-1.5">Or choose a preset cover:</p>
                            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                              {PRESET_COVERS.map((preset) => (
                                <button
                                  key={preset.name}
                                  type="button"
                                  onClick={() => setImportCover(preset.url)}
                                  className={`w-14 h-14 rounded-xl border-2 flex-shrink-0 overflow-hidden relative group transition-all hover:scale-105 cursor-pointer ${
                                    importCover === preset.url ? "border-blue-600 scale-105" : "border-black"
                                  }`}
                                  title={preset.name}
                                >
                                  <img 
                                    src={preset.url} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer" 
                                    alt={preset.name} 
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-[8px] font-bold text-white text-center leading-none px-1">{preset.name}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Or direct text link input */}
                          <div className="relative">
                            <input
                              type="url"
                              value={importCover}
                              onChange={(e) => setImportCover(e.target.value)}
                              placeholder="Or paste an image URL..."
                              className="w-full px-4 py-2 text-xs rounded-xl border-2 border-black bg-white focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleCloseImportModal}
                        className="py-2.5 rounded-full bg-white hover:bg-gray-50 border-2 border-black font-extrabold text-xs text-center cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-2.5 rounded-full bg-[#FFF1C2] hover:bg-[#ffeaa7] border-2 border-black font-extrabold text-xs text-center cursor-pointer transition-all neo-shadow-sm active:translate-y-0.5 active:shadow-none"
                      >
                        Add & Play
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <MainApp />
      </AudioProvider>
    </AuthProvider>
  );
}
