import React, { useState, useEffect } from "react";
import { 
  Search, 
  User, 
  Menu,
  X, 
  Sparkles, 
  LogOut, 
  Check,
  AlertCircle,
  Loader2,
  Smartphone,
  Download,
  Share,
  PlusSquare,
  MoreVertical,
  ExternalLink,
  WifiOff,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { InstallCard } from "./InstallCard";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { requestNotificationPermission } from "../lib/onesignal";

interface HeaderProps {
  onSearchChange: (query: string) => void;
  searchQuery: string;
  onSelectOffline?: () => void;
  isProfileOpen?: boolean;
  onOpenProfile?: () => void;
  onCloseProfile?: () => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ 
  onSearchChange, 
  searchQuery, 
  onSelectOffline,
  isProfileOpen: externalIsProfileOpen,
  onOpenProfile,
  onCloseProfile
}) => {
  const { user, userProfile, loginWithGoogle, logout } = useAuth();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [internalIsProfileOpen, setInternalIsProfileOpen] = useState(false);
  const isProfileOpen = externalIsProfileOpen !== undefined ? externalIsProfileOpen : internalIsProfileOpen;
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Authentication state
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");

  const { isStandalone, promptInstall } = usePWAInstall();

  // Sync back button with menu drawer & profile modal
  useEffect(() => {
    const handlePopState = () => {
      setIsMenuOpen(false);
      closeProfile();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openMenu = () => {
    window.history.pushState({ modal: "menu" }, "");
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    if (window.history.state?.modal === "menu") {
      window.history.back();
    } else {
      setIsMenuOpen(false);
    }
  };

  const openProfile = () => {
    window.history.pushState({ modal: "profile" }, "");
    if (onOpenProfile) onOpenProfile();
    else setInternalIsProfileOpen(true);
  };

  const closeProfile = () => {
    if (window.history.state?.modal === "profile") {
      window.history.back();
    } else {
      if (onCloseProfile) onCloseProfile();
      else setInternalIsProfileOpen(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError("");
    setIsAuthenticating(true);
    try {
      await loginWithGoogle();
      closeProfile();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setAuthError("Sign in was cancelled.");
      } else {
        setAuthError(err.message || "Uingizaji kupitia Google umefeli. Jaribu tena.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <header id="app-header" className="relative z-40 px-6 py-4 flex items-center justify-between bg-[#F7F4F0] border-b-2 border-black">
      {/* Left Menu Button & Logo */}
      <div className="flex items-center gap-3">
        <button
          id="menu-btn"
          onClick={openMenu}
          className="p-2.5 rounded-full border-2 border-black bg-[#FFF1C2] hover:bg-[#ffeaa7] neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5 text-black" />
        </button>
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <img 
              src="/icon-192.png" 
              alt="SimuliziMix Logo" 
              className="w-9 h-9 rounded-xl border-2 border-black object-cover neo-shadow-xs"
            />
          </motion.div>
          <span className="font-display text-xl font-extrabold tracking-tight select-none">
            Simulizi<span className="text-[#3b82f6] bg-[#CCE4F5] px-2 py-0.5 rounded-lg border border-black ml-1">Mix</span>
          </span>
        </div>
      </div>

      {/* Right Search & Profile */}
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          <AnimatePresence>
            {showSearchInput && (
              <motion.input
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 170, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search audio..."
                className="px-4 py-2 text-xs rounded-full border-2 border-black bg-white focus:outline-none focus:ring-2 focus:ring-[#CCE4F5] mr-2"
                autoFocus
              />
            )}
          </AnimatePresence>
          
          <button
            id="search-btn"
            onClick={() => setShowSearchInput(!showSearchInput)}
            className={`p-2.5 rounded-full border-2 border-black transition-all cursor-pointer ${
              showSearchInput ? "bg-[#CCE4F5]" : "bg-white hover:bg-gray-100 neo-shadow-sm"
            }`}
            aria-label="Search"
          >
            {showSearchInput ? <X className="w-5 h-5 text-black" /> : <Search className="w-5 h-5 text-black" />}
          </button>
        </div>

        {/* Push Notification Bell */}
        <button
          id="onesignal-notification-btn"
          onClick={() => requestNotificationPermission()}
          title="Enable Notifications"
          className="p-2.5 rounded-full border-2 border-black bg-white hover:bg-[#FFF1C2] neo-shadow-sm transition-all cursor-pointer"
          aria-label="Enable Push Notifications"
        >
          <Bell className="w-5 h-5 text-black" />
        </button>

        {/* Profile Avatar / Login Button */}
        <button
          id="profile-btn"
          onClick={openProfile}
          className={`w-11 h-11 rounded-full border-2 border-black overflow-hidden flex items-center justify-center neo-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000000] active:translate-x-0 active:translate-y-0 active:shadow-sm transition-all cursor-pointer ${
            user ? "bg-[#FCE2E6]" : "bg-[#FFF1C2]"
          }`}
        >
          {user ? (
            <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-display font-black text-sm">
              {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : "ME"}
            </div>
          ) : (
            <User className="w-5 h-5 text-black" />
          )}
        </button>
      </div>

      {/* Sidebar Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 bg-black z-50"
            />
            
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-[#F7F4F0] border-r-4 border-black z-50 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-black">
                  <div className="flex items-center gap-2">
                    <img 
                      src="/icon-192.png" 
                      alt="SimuliziMix Logo" 
                      className="w-8 h-8 rounded-xl border-2 border-black object-cover"
                    />
                    <h3 className="font-display text-2xl font-black">SimuliziMix</h3>
                  </div>
                  <button
                    onClick={closeMenu}
                    className="p-1.5 rounded-full border-2 border-black bg-white hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border-2 border-black bg-[#CCE4F5] neo-shadow-sm">
                    <h4 className="font-bold flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                      SimuliziMix Cloud
                    </h4>
                    <p className="text-[11px] text-gray-700 mt-1 leading-relaxed">
                      Sikiliza na uhifadhi masimulizi yako mtandaoni kwa usalama na urahisi.
                    </p>
                  </div>

                  <nav className="space-y-2 pt-2">
                    <button
                      onClick={() => { closeMenu(); openProfile(); }}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-black bg-white hover:bg-gray-50 transition-all font-bold text-left text-xs neo-shadow-xs cursor-pointer"
                    >
                      <User className="w-4 h-4 text-indigo-600" />
                      {user ? "Akaunti Yangu" : "Jiunge na Google"}
                    </button>

                    <button
                      onClick={() => { closeMenu(); onSelectOffline?.(); }}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-black bg-[#CCE4F5] hover:bg-[#a9d0eb] transition-all font-black text-left text-xs neo-shadow-xs cursor-pointer"
                    >
                      <WifiOff className="w-4 h-4 text-blue-700" />
                      <span>Masimulizi ya Offline (Downloaded)</span>
                    </button>

                    <button
                      onClick={() => { closeMenu(); requestNotificationPermission(); }}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-black bg-[#FFF1C2] hover:bg-[#ffe699] transition-all font-black text-left text-xs neo-shadow-xs cursor-pointer"
                    >
                      <Bell className="w-4 h-4 text-amber-600 fill-amber-500" />
                      <span>Jiunge na Taarifa (Push Notifications)</span>
                    </button>

                    {!isStandalone && (
                      <button
                        onClick={() => { closeMenu(); promptInstall(); }}
                        className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-black bg-[#FFF1C2] hover:bg-[#ffe699] transition-all font-black text-left text-xs neo-shadow-xs cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4 text-black" />
                        <span>Sakinisha App (Install PWA)</span>
                      </button>
                    )}
                  </nav>
                </div>
              </div>

              <div className="p-3 rounded-xl border-2 border-black bg-[#CCE4F5] text-[10px] font-mono text-center font-bold flex items-center justify-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 text-blue-800" />
                <span>Supports Offline Playback</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>



      {/* Cloud Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={closeProfile}
              className="fixed inset-0 bg-black z-50"
            />

            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-[#F7F4F0] border-4 border-black rounded-[28px] p-6 neo-shadow-lg relative overflow-y-auto max-h-[90vh]"
              >
                <button
                  onClick={closeProfile}
                  className="absolute top-4 right-4 p-1.5 rounded-full border-2 border-black bg-white hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {user ? (
                  // Logged In profile
                  <div className="flex flex-col items-center text-center pt-2">
                    <div className="w-20 h-20 rounded-full border-4 border-black bg-[#FCE2E6] overflow-hidden mb-3 flex items-center justify-center font-display font-black text-2xl text-rose-700 neo-shadow-sm">
                      {userProfile?.displayName ? userProfile.displayName.substring(0, 2).toUpperCase() : (user.displayName ? user.displayName.substring(0, 2).toUpperCase() : "ME")}
                    </div>
                    <h3 className="font-display text-xl font-black text-black">
                      {userProfile?.displayName || user.displayName || "Avid Listener"}
                    </h3>
                    <p className="text-gray-500 font-bold text-xs mt-0.5">{user.email}</p>

                    <div className="grid grid-cols-2 gap-3 w-full my-5">
                      <div className="p-3 bg-[#FFF1C2] border-2 border-black rounded-2xl text-center">
                        <span className="block font-display text-xl font-black">{userProfile?.favorites.length || 0}</span>
                        <span className="text-[10px] font-black text-gray-700 uppercase">Favorites Synced</span>
                      </div>
                      <div className="p-3 bg-[#CCE4F5] border-2 border-black rounded-2xl text-center">
                        <span className="block font-display text-xl font-black">{userProfile?.customStories.length || 0}</span>
                        <span className="text-[10px] font-black text-gray-700 uppercase">My Stories</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white border-2 border-black rounded-xl text-left w-full text-xs text-gray-600 font-medium mb-5 flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Umeunganishwa na Google. Vipendwa na masimulizi yako vinahifadhiwa kwa usalama!</span>
                    </div>

                    <button
                      onClick={() => { logout(); closeProfile(); }}
                      className="w-full py-2.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 border-2 border-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-y-0.5"
                    >
                      <LogOut className="w-4 h-4" />
                      Toka kwenye Akaunti (Sign Out)
                    </button>
                  </div>
                ) : (
                  // Google Sign-In Card
                  <div className="pt-2 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#FFF1C2] border-2 border-black flex items-center justify-center mx-auto mb-3 neo-shadow-xs">
                      <GoogleIcon />
                    </div>
                    
                    <h3 className="font-display font-black text-xl text-black mb-1">
                      Jiunge na SimuliziMix
                    </h3>
                    <p className="text-xs text-gray-600 mb-6 font-medium leading-relaxed px-2">
                      Sajili au ingia kwa mbofyo mmoja ukitumia akaunti yako ya Google kuhifadhi vipendwa na masimulizi yako.
                    </p>

                    {authError && (
                      <div className="p-3 bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-semibold mb-4 text-left">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isAuthenticating}
                      onClick={handleGoogleSignIn}
                      className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 text-black border-2 border-black rounded-2xl font-black text-xs flex items-center justify-center gap-3 neo-shadow-sm active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isAuthenticating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Inaingia na Google...</span>
                        </>
                      ) : (
                        <>
                          <GoogleIcon />
                          <span className="text-sm font-black">Jiunge na Google</span>
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-gray-400 font-medium mt-4">
                      Haraka, rahisi na salama kupitia Google Auth.
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      {/* PWA Custom Install Banner */}
      <InstallCard />
    </header>
  );
};
