import OneSignal from 'react-onesignal';

export const ONESIGNAL_APP_ID = '247aaeb9-b473-48cc-9e3f-9d4d0c0d3449';

let initialized = false;

export async function initOneSignal(): Promise<void> {
  if (typeof window === 'undefined' || initialized) return;

  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: false, // We provide custom toggle or slidedown
      },
      serviceWorkerParam: {
        scope: '/',
      },
      serviceWorkerPath: '/OneSignalSDKWorker.js',
    });
    initialized = true;
    console.log('[OneSignal] SDK initialized successfully with App ID:', ONESIGNAL_APP_ID);
  } catch (error) {
    console.error('[OneSignal] Initialization error:', error);
  }
}

export async function requestNotificationPermission(): Promise<void> {
  try {
    if (!initialized) {
      await initOneSignal();
    }
    await OneSignal.Notifications.requestPermission();
  } catch (error) {
    console.error('[OneSignal] Permission request error:', error);
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}
