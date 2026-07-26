import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if app is running as a standalone PWA
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    };

    checkStandalone();

    // Check if prompt was saved prior to hook mount
    if ((window as any).deferredPwaPrompt) {
      setDeferredPrompt((window as any).deferredPwaPrompt);
      setIsInstallable(true);
    }

    // 2. Capture Chrome's install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent Chrome's default mini-infobar
      (window as any).deferredPwaPrompt = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // 3. Hide card if app successfully installs
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      (window as any).deferredPwaPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPwaPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult?.outcome === 'accepted') {
          console.log('User installed the PWA');
          setIsStandalone(true);
          setIsInstallable(false);
          return true;
        }
      } catch (err) {
        console.warn('PWA prompt error:', err);
      } finally {
        setDeferredPrompt(null);
        (window as any).deferredPwaPrompt = null;
        setIsInstallable(false);
      }
    }
    return false;
  };

  return { isInstallable, isStandalone, promptInstall, deferredPrompt };
}
