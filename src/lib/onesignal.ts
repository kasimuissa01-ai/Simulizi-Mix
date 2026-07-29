import OneSignal from 'react-onesignal';

export const ONESIGNAL_APP_ID = '247aaeb9-b473-48cc-9e3f-9d4d0c0d3449';

let initialized = false;

export async function initOneSignal(): Promise<void> {
  if (typeof window === 'undefined') return;

  // If already initialized via index.html or previous call
  if (initialized || (window as any)?.OneSignal?.initialized) {
    initialized = true;
    return;
  }

  // If window.OneSignalDeferred is present, initialization is handled by script in index.html
  if ((window as any)?.OneSignalDeferred) {
    initialized = true;
    return;
  }

  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      safari_web_id: "web.onesignal.auto.1d9d9717-02c9-46fa-a0ca-aedc9bb61733",
      notifyButton: {
        enable: true,
      },
    });
    initialized = true;
  } catch (error: any) {
    initialized = true;
  }
}

export async function requestNotificationPermission(): Promise<void> {
  try {
    const winOneSignal = (window as any).OneSignal;
    if (winOneSignal?.Notifications?.requestPermission) {
      await winOneSignal.Notifications.requestPermission();
    } else if (OneSignal?.Notifications?.requestPermission) {
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

