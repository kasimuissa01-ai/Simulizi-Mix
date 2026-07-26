import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { X, Smartphone, Share, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function InstallCard() {
  const { isStandalone, promptInstall, deferredPrompt } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('simulizi_install_dismissed') === 'true';
  });
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already running in standalone PWA mode or dismissed for session, don't show card
  if (isStandalone || dismissed) return null;

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPwaPrompt;
    if (promptEvent) {
      // Chrome / Android: Trigger native browser prompt directly
      const installed = await promptInstall();
      if (installed) {
        setDismissed(true);
        sessionStorage.setItem('simulizi_install_dismissed', 'true');
      }
      // Never display manual instruction modal if Chrome native prompt was triggered
      return;
    }

    // iOS / Safari / Unsupported browsers: Fallback to manual instruction modal
    setShowGuideModal(true);
  };

  return (
    <>
      {/* Floating Bottom Install Banner */}
      <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-[100] bg-[#FFF1C2] border-3 border-black rounded-2xl p-2.5 px-3 neo-shadow-md flex items-center justify-between gap-2.5 transition-all">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <img
            src="https://vqgnxqabvmmpfoiceass.supabase.co/storage/v1/object/public/simulizi-audio/Change_words_on_image_202607211424.jpeg"
            alt="SimuliziMix Logo"
            className="w-10 h-10 rounded-xl border-2 border-black object-cover flex-shrink-0 neo-shadow-xs"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-display font-black text-xs text-black leading-tight truncate">
              Sakinisha SimuliziMix App
            </h4>
            <p className="text-[10px] text-gray-700 font-semibold leading-tight truncate">
              Sikiliza masimulizi bila usumbufu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white border-2 border-black rounded-xl font-black text-xs flex items-center gap-1 cursor-pointer neo-shadow-xs active:translate-y-0.5 transition-transform"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sakinisha</span>
          </button>

          <button
            onClick={() => {
              setDismissed(true);
              sessionStorage.setItem('simulizi_install_dismissed', 'true');
            }}
            className="p-1.5 rounded-lg text-black hover:bg-black/10 cursor-pointer transition-colors"
            title="Funga"
            aria-label="Funga"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Guide Modal */}
      <AnimatePresence>
        {showGuideModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuideModal(false)}
              className="fixed inset-0 bg-black z-[120]"
            />
            <div className="fixed inset-0 flex items-center justify-center z-[121] p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 15 }}
                className="w-full max-w-sm bg-[#FFF8F0] border-4 border-black rounded-[28px] p-5 neo-shadow-xl relative overflow-hidden"
              >
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-white border-2 border-black hover:bg-gray-100 text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <img
                    src="https://vqgnxqabvmmpfoiceass.supabase.co/storage/v1/object/public/simulizi-audio/Change_words_on_image_202607211424.jpeg"
                    alt="SimuliziMix Logo"
                    className="w-12 h-12 rounded-2xl border-2 border-black object-cover neo-shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-display font-black text-lg text-black leading-tight">
                      Sakinisha SimuliziMix App
                    </h3>
                    <p className="text-xs text-gray-600 font-bold">
                      Jinsi ya kuweka app kwenye simu yako
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-black font-medium mb-5">
                  <div className="p-3 bg-white border-2 border-black rounded-xl neo-shadow-xs">
                    <p className="font-black text-black text-xs mb-1 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-amber-600" />
                      <span>Kwenye Chrome (Android / Desktop):</span>
                    </p>
                    <ol className="list-decimal list-inside text-[11px] text-gray-700 space-y-1 font-semibold pl-1">
                      <li>Bonyeza <strong>vitone vitatu (⋮)</strong> juu ya kivinjari cha Chrome.</li>
                      <li>Chagua <strong>"Sakinisha app" (Install app)</strong> au <strong>"Weka kwenye skrini ya kwanza"</strong>.</li>
                    </ol>
                  </div>

                  <div className="p-3 bg-white border-2 border-black rounded-xl neo-shadow-xs">
                    <p className="font-black text-black text-xs mb-1 flex items-center gap-1.5">
                      <Share className="w-4 h-4 text-blue-600" />
                      <span>Kwenye iPhone / Safari (iOS):</span>
                    </p>
                    <ol className="list-decimal list-inside text-[11px] text-gray-700 space-y-1 font-semibold pl-1">
                      <li>Bonyeza kitufe cha Kushiriki <strong>(Share ↑)</strong> chini ya Safari.</li>
                      <li>Sogeza chini kisha chagua <strong>"Weka kwenye Skrini ya Kwanza" (Add to Home Screen)</strong>.</li>
                    </ol>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      promptInstall();
                      setShowGuideModal(false);
                    }}
                    className="w-full py-3 bg-[#FFF1C2] hover:bg-[#ffeaa7] text-black border-2 border-black rounded-2xl font-black text-xs neo-shadow-sm active:translate-y-0.5 cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-black" />
                    <span>Sawa, Nimeelewa</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
