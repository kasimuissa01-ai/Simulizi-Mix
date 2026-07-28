import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if app is running as a standalone PWA or previously installed
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.startsWith('android-app://') ||
        localStorage.getItem('pwa_installed') === 'true';

      if (standalone) {
        setIsStandalone(true);
        setIsInstallable(false);
      } else {
        setIsStandalone(false);
      }
    };

    checkStandalone();

    // Check if prompt was saved prior to hook mount
    if ((window as any).deferredPwaPrompt) {
      setDeferredPrompt((window as any).deferredPwaPrompt);
      if (localStorage.getItem('pwa_installed') !== 'true') {
        setIsInstallable(true);
      }
    }

    // Attach callback for early prompt event listener in index.html
    (window as any).onPwaPromptReady = (e: any) => {
      setDeferredPrompt(e);
      if (localStorage.getItem('pwa_installed') !== 'true') {
        setIsInstallable(true);
      }
    };

    // 2. Capture Chrome's install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent Chrome's default mini-infobar
      (window as any).deferredPwaPrompt = e;
      setDeferredPrompt(e);
      if (localStorage.getItem('pwa_installed') !== 'true') {
        setIsInstallable(true);
      }
    };

    // 3. Hide card if app successfully installs
    const handleAppInstalled = () => {
      localStorage.setItem('pwa_installed', 'true');
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
      try {
        delete (window as any).onPwaPromptReady;
      } catch (e) {}
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
