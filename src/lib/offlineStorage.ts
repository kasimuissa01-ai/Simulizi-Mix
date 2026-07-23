import { Story } from "../data/stories";

const DB_NAME = "SimuliziMixOfflineDB";
const DB_VERSION = 1;
const STORE_METADATA = "downloaded_stories";
const STORE_AUDIO_BLOBS = "audio_blobs";

export interface OfflineStoryMeta {
  storyId: string;
  story: Story;
  downloadedAt: number;
  totalSizeMB: string;
}

// Open or initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_METADATA)) {
        db.createObjectStore(STORE_METADATA, { keyPath: "storyId" });
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO_BLOBS)) {
        db.createObjectStore(STORE_AUDIO_BLOBS, { keyPath: "url" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save audio blob to IndexedDB
async function saveAudioBlob(url: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO_BLOBS, "readwrite");
    const store = tx.objectStore(STORE_AUDIO_BLOBS);
    const req = store.put({ url, blob, updatedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Get audio blob from IndexedDB
async function getAudioBlob(url: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_AUDIO_BLOBS, "readonly");
      const store = tx.objectStore(STORE_AUDIO_BLOBS);
      const req = store.get(url);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    console.error("Error reading audio blob from IndexedDB", e);
    return null;
  }
}

// Delete audio blob
async function deleteAudioBlob(url: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_AUDIO_BLOBS, "readwrite");
      const store = tx.objectStore(STORE_AUDIO_BLOBS);
      const req = store.delete(url);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (e) {
    console.error("Error deleting audio blob", e);
  }
}

/**
 * Download a story for 100% offline listening
 */
export async function downloadStoryOffline(
  story: Story,
  onProgress?: (percent: number) => void
): Promise<boolean> {
  try {
    let totalBytes = 0;
    const chapters = story.chapters || [];
    const totalChapters = chapters.length;

    if (totalChapters === 0) return false;

    // Cache API handle
    let cache: Cache | null = null;
    if ("caches" in window) {
      try {
        cache = await caches.open("simulizi-audio-v1");
      } catch (e) {
        console.warn("Cache API unavailable, relying on IndexedDB store");
      }
    }

    for (let i = 0; i < totalChapters; i++) {
      const chapter = chapters[i];
      const audioUrl = chapter.audioUrl;

      if (!audioUrl) continue;

      // Fetch the audio stream
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio for chapter: ${chapter.title}`);
      }

      // Clone response to put into Cache API
      if (cache) {
        try {
          cache.put(audioUrl, response.clone());
        } catch (err) {
          console.warn("Could not cache to Cache Storage API:", err);
        }
      }

      const blob = await response.blob();
      totalBytes += blob.size;

      // Save blob to IndexedDB
      await saveAudioBlob(audioUrl, blob);

      // Report progress
      const percent = Math.round(((i + 1) / totalChapters) * 100);
      if (onProgress) onProgress(percent);
    }

    const totalSizeMB = (totalBytes / (1024 * 1024)).toFixed(1) + " MB";

    // Save story metadata
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_METADATA, "readwrite");
      const store = tx.objectStore(STORE_METADATA);
      const req = store.put({
        storyId: story.id,
        story,
        downloadedAt: Date.now(),
        totalSizeMB,
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return true;
  } catch (err) {
    console.error("Error downloading story offline:", err);
    throw err;
  }
}

/**
 * Check if a story is downloaded for offline playback
 */
export async function isStoryDownloaded(storyId: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_METADATA, "readonly");
      const store = tx.objectStore(STORE_METADATA);
      const req = store.get(storyId);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

/**
 * Get all downloaded offline stories
 */
export async function getOfflineStories(): Promise<OfflineStoryMeta[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_METADATA, "readonly");
      const store = tx.objectStore(STORE_METADATA);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

/**
 * Delete downloaded story from offline storage
 */
export async function removeOfflineStory(story: Story): Promise<void> {
  try {
    // Delete blobs
    for (const ch of story.chapters) {
      if (ch.audioUrl) {
        await deleteAudioBlob(ch.audioUrl);
        if ("caches" in window) {
          try {
            const cache = await caches.open("simulizi-audio-v1");
            await cache.delete(ch.audioUrl);
          } catch (e) {}
        }
      }
    }

    // Delete metadata
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_METADATA, "readwrite");
      const store = tx.objectStore(STORE_METADATA);
      const req = store.delete(story.id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (e) {
    console.error("Error removing offline story:", e);
  }
}

/**
 * Get offline playable URL (Object URL from Blob if offline or available)
 */
export async function getPlayableAudioUrl(originalUrl: string): Promise<string> {
  if (!originalUrl) return originalUrl;

  const blob = await getAudioBlob(originalUrl);
  if (blob) {
    return URL.createObjectURL(blob);
  }

  return originalUrl;
}
