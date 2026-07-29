import OneSignal from 'react-onesignal';

export const ONESIGNAL_APP_ID = '247aaeb9-b473-48cc-9e3f-9d4d0c0d3449';

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function initOneSignal(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Check if already initialized in module state or on window
  if (initialized || (OneSignal as any)?.initialized || (window as any)?.OneSignal?.initialized) {
    initialized = true;
    return;
  }

  // Deduplicate concurrent initialization calls
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false, // Custom notification bell provided in header
        },
        serviceWorkerParam: {
          scope: '/onesignal/',
        },
        serviceWorkerPath: 'onesignal/OneSignalSDKWorker.js',
      });
      initialized = true;
      console.log('[OneSignal] SDK initialized successfully with App ID:', ONESIGNAL_APP_ID);
    } catch (error: any) {
      initialized = true; // Mark attempted to avoid continuous re-init retries on every render
      const msg = error?.message || String(error || '');

      if (msg.includes('already initialized') || msg.includes('SDK already initialized')) {
        console.log('[OneSignal] SDK already initialized.');
      } else if (msg.includes('App not configured for web push') || msg.includes('not configured')) {
        console.warn('[OneSignal] Notice: Web push needs your origin domain configured in OneSignal Dashboard (https://onesignal.com).', msg);
      } else {
        console.warn('[OneSignal] Initialization notice:', msg);
      }
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export async function requestNotificationPermission(): Promise<void> {
  try {
    if (!initialized) {
      await initOneSignal();
    }

    if (OneSignal?.Notifications?.requestPermission) {
      await OneSignal.Notifications.requestPermission();
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.requestPermission) {
      await Notification.requestPermission();
    }
  } catch (error: any) {
    console.warn('[OneSignal] Permission request notice:', error?.message || error);
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}
