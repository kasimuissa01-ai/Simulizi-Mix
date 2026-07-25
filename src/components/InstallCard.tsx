import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { X } from 'lucide-react';

export function InstallCard() {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // If already installed, dismissed, or browser hasn't fired beforeinstallprompt, don't show card
  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-[#FFF8F0] border-4 border-black rounded-2xl p-3.5 neo-shadow-xl flex items-center justify-between z-[100] transition-all">
      <div className="flex items-center space-x-3 overflow-hidden pr-2">
        <img
          src="https://vqgnxqabvmmpfoiceass.supabase.co/storage/v1/object/public/simulizi-audio/Change_words_on_image_202607211424.jpeg"
          alt="SimuliziMix Logo"
          className="w-11 h-11 rounded-xl border-2 border-black object-cover flex-shrink-0"
        />
        <div className="overflow-hidden">
          <h3 className="font-bold font-display text-gray-900 text-sm leading-tight truncate">
            Sakinisha SimuliziMix
          </h3>
          <p className="text-xs text-gray-600 font-medium truncate">
            Weka kwenye skrini kwa urahisi
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={promptInstall}
          className="bg-[#FFF1C2] hover:bg-[#ffe699] text-black font-black text-xs px-3.5 py-2 rounded-xl border-2 border-black neo-shadow-xs transition-transform active:translate-y-0.5 cursor-pointer"
        >
          Sakinisha
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
          title="Funga"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
