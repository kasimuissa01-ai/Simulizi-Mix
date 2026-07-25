import { createClient } from "@supabase/supabase-js";
import { Story } from "../data/stories";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  bucket: string;
}

// Get the config from environment or localStorage
export function getSupabaseConfig(): SupabaseConfig {
  const defaultUrl = "https://vqgnxqabvmmpfoiceass.supabase.co";
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || defaultUrl;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";
  
  // 1. Check local storage first (user saved credentials in Profile Settings)
  const localConfig = localStorage.getItem("simulizi_supabase_config");
  if (localConfig) {
    try {
      const parsed = JSON.parse(localConfig);
      if (parsed.anonKey) {
        return {
          url: parsed.url || defaultUrl,
          anonKey: parsed.anonKey,
          bucket: parsed.bucket || "simulizi-audio"
        };
      }
    } catch (e) {
      console.error("Error parsing local Supabase config", e);
    }
  }

  // 2. Check environment variables
  if (envKey) {
    return {
      url: envUrl,
      anonKey: envKey,
      bucket: (import.meta as any).env?.VITE_SUPABASE_BUCKET || "simulizi-audio"
    };
  }

  return {
    url: envUrl,
    anonKey: envKey,
    bucket: "simulizi-audio"
  };
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem("simulizi_supabase_config", JSON.stringify(config));
}

export function clearSupabaseConfig() {
  localStorage.removeItem("simulizi_supabase_config");
}

// Create client dynamically
export function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }
  return createClient(config.url, config.anonKey);
}

// Function to upload a file to Storage with seamless fallback
export async function uploadToSupabase(file: File): Promise<string> {
  const config = getSupabaseConfig();
  const supabase = getSupabaseClient();
  
  if (supabase) {
    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "mp3";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Determine MIME type explicitly
      let mimeType = file.type;
      if (!mimeType) {
        if (fileExt === 'mp3') mimeType = 'audio/mpeg';
        else if (fileExt === 'm4a') mimeType = 'audio/mp4';
        else if (fileExt === 'wav') mimeType = 'audio/wav';
        else if (fileExt === 'aac') mimeType = 'audio/aac';
        else if (fileExt === 'ogg') mimeType = 'audio/ogg';
        else if (fileExt === 'flac') mimeType = 'audio/flac';
        else if (fileExt === 'jpg' || fileExt === 'jpeg') mimeType = 'image/jpeg';
        else if (fileExt === 'png') mimeType = 'image/png';
        else if (fileExt === 'webp') mimeType = 'image/webp';
      }

      // Upload the file to Supabase Storage bucket with explicit MIME type & upsert
      const { data, error } = await supabase.storage
        .from(config.bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: mimeType || undefined
        });

      if (!error && data) {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(config.bucket)
          .getPublicUrl(filePath);

        if (publicUrl) return publicUrl;
      } else if (error) {
        console.error("Supabase Storage Upload Error:", error.message, error);
        throw new Error(`Hitilafu ya Supabase Storage: ${error.message}`);
      }
    } catch (e: any) {
      console.warn("Notice: Supabase upload notice:", e);
      if (e.message && e.message.includes("Hitilafu ya Supabase Storage")) {
        throw e;
      }
    }
  }

  // If file is > 800KB and Supabase isn't connected or storage upload failed
  if (file.size > 800 * 1024) {
    throw new Error("Sauti haikuweza kuhifadhiwa kwenye Supabase Storage. Hakikisha Storage Bucket 'simulizi-audio' ipo na ni PUBLIC kwenye Supabase Dashboard (Storage -> Buckets -> Make Public).");
  }

  // Fallback for small files (covers / short samples): Convert file to Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Fetch all stories stored in Supabase database table 'stories'
export async function fetchSupabaseStories(): Promise<Story[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const stories: Story[] = [];

  // Query Supabase 'stories' table for saved story objects
  try {
    const { data, error } = await supabase.from('stories').select('*');
    if (!error && Array.isArray(data)) {
      data.forEach((row) => {
        const title = row.title || row.name || "Untitled Story";
        
        // Extract audio URL from any column standard
        const audioUrlFromRow =
          row.audio_url ||
          row.audioUrl ||
          row.url ||
          row.audio ||
          row.audio_path ||
          (Array.isArray(row.chapters) && row.chapters[0]?.audioUrl) ||
          "";

        // Parse chapters JSON or array
        let chapters: any[] = [];
        if (Array.isArray(row.chapters) && row.chapters.length > 0) {
          chapters = row.chapters;
        } else if (typeof row.chapters === "string" && row.chapters.startsWith("[")) {
          try {
            chapters = JSON.parse(row.chapters);
          } catch (e) {}
        }

        // Guarantee chapters has at least 1 chapter containing the audio URL
        if ((!chapters || chapters.length === 0) && audioUrlFromRow) {
          chapters = [
            {
              id: 1,
              title: `Sura ya 1: ${title}`,
              duration: row.duration || "Full Track",
              durationSeconds: row.duration_seconds || row.durationSeconds || 0,
              audioUrl: audioUrlFromRow
            }
          ];
        }

        // Only include valid stories that have audio
        if (audioUrlFromRow || (chapters.length > 0 && chapters[0].audioUrl)) {
          stories.push({
            id: String(row.id || `supabase-${Math.random().toString(36).substring(2, 9)}`),
            title: title,
            subtitle: row.subtitle || row.description || "Simulizi ya Sauti",
            author: row.author || row.creator || "Kendrick",
            creatorHandle: row.creator_handle || row.creatorHandle || "@Kendrick",
            tiktokUrl: row.tiktok_url || row.tiktokUrl || "",
            instagramUrl: row.instagram_url || row.instagramUrl || "",
            narrator: row.narrator || row.author || "Kendrick",
            category: row.category || "Simulizi",
            rating: Number(row.rating) || 5.0,
            description: row.description || "Simulizi kutoka Supabase",
            coverUrl: row.cover_url || row.coverUrl || row.image_url || "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600",
            accentColor: row.accent_color || row.accentColor || "#CCE4F5",
            narratorAvatar: row.narrator_avatar || row.narratorAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
            chapters: chapters
          });
        }
      });
    }
  } catch (e) {
    console.warn("Notice: Supabase 'stories' table not queried or not present", e);
  }

  return stories;
}

// Save or Sync story object to Supabase database table 'stories'
export async function saveStoryToSupabase(story: Story): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const primaryAudioUrl = story.chapters[0]?.audioUrl || "";
    const payload: any = {
      id: story.id,
      title: story.title,
      subtitle: story.subtitle,
      author: story.author,
      creator_handle: story.creatorHandle,
      tiktok_url: story.tiktokUrl,
      instagram_url: story.instagramUrl,
      narrator: story.narrator,
      category: story.category,
      rating: story.rating,
      description: story.description,
      cover_url: story.coverUrl,
      accent_color: story.accentColor,
      narrator_avatar: story.narratorAvatar,
      chapters: story.chapters,
      audio_url: primaryAudioUrl,
      audioUrl: primaryAudioUrl,
      url: primaryAudioUrl,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('stories').upsert(payload);
    if (error) {
      console.warn("Notice: Upsert with extra columns failed, attempting fallback payload:", error.message);
      const simplePayload = {
        id: story.id,
        title: story.title,
        cover_url: story.coverUrl,
        audio_url: primaryAudioUrl,
        chapters: story.chapters,
        updated_at: new Date().toISOString()
      };
      await supabase.from('stories').upsert(simplePayload);
    }
    return true;
  } catch (e) {
    console.error("Error saving story to Supabase:", e);
    return false;
  }
}

// Permanently delete a story from Supabase database table 'stories' and Supabase Storage bucket
export async function deleteStoryFromSupabase(storyId: string, audioUrl?: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const config = getSupabaseConfig();
  if (!supabase) return false;

  let success = false;

  // 1. Delete record from Supabase 'stories' DB table
  try {
    const { error } = await supabase.from('stories').delete().eq('id', storyId);
    if (!error) {
      success = true;
    } else {
      console.warn("Notice: Delete from Supabase DB table:", error.message);
    }
  } catch (e) {
    console.warn("Error deleting story from Supabase DB:", e);
  }

  // 2. Delete file from Supabase Storage bucket if story came from storage or audioUrl is hosted on Supabase
  try {
    let fileToDelete = "";
    if (storyId.startsWith("sp-storage-")) {
      fileToDelete = storyId.replace("sp-storage-", "");
    } else if (audioUrl && audioUrl.includes(config.bucket)) {
      const parts = audioUrl.split(`${config.bucket}/`);
      if (parts.length > 1) {
        fileToDelete = decodeURIComponent(parts[1].split('?')[0]);
      }
    }

    if (fileToDelete) {
      const { error: storageErr } = await supabase.storage.from(config.bucket).remove([fileToDelete]);
      if (!storageErr) {
        success = true;
      } else {
        console.warn("Notice: Could not remove file from Supabase Storage:", storageErr.message);
      }
    }
  } catch (e) {
    console.warn("Error removing file from Supabase Storage:", e);
  }

  return success;
}

