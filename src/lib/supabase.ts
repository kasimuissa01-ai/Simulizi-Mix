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
  
  if (envKey) {
    return {
      url: envUrl,
      anonKey: envKey,
      bucket: (import.meta as any).env?.VITE_SUPABASE_BUCKET || "simulizi-audio"
    };
  }

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
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file
      const { error } = await supabase.storage
        .from(config.bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (!error) {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(config.bucket)
          .getPublicUrl(filePath);

        if (publicUrl) return publicUrl;
      } else {
        console.warn("Supabase storage error:", error.message);
      }
    } catch (e) {
      console.warn("Notice: Supabase upload notice:", e);
    }
  }

  // If file is > 800KB and Supabase isn't connected, throw a clear error to prevent Firestore document size limit failures
  if (file.size > 800 * 1024) {
    throw new Error("Supabase Storage is not connected. Enter your Supabase Anon Key in Profile Settings or set VITE_SUPABASE_ANON_KEY in Vercel environment variables to host audio files on universal cloud storage.");
  }

  // Fallback for small files (covers / short samples): Convert file to Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Fetch all stories stored in Supabase database OR uploaded to Supabase Storage bucket
export async function fetchSupabaseStories(): Promise<Story[]> {
  const supabase = getSupabaseClient();
  const config = getSupabaseConfig();
  if (!supabase) return [];

  const stories: Story[] = [];

  // 1. Query Supabase 'stories' table
  try {
    const { data, error } = await supabase.from('stories').select('*');
    if (!error && Array.isArray(data)) {
      data.forEach((row) => {
        const title = row.title || row.name || "Untitled Story";
        const chapters = Array.isArray(row.chapters) ? row.chapters : [
          {
            id: 1,
            title: `Sura ya 1: ${title}`,
            duration: row.duration || "Full Track",
            durationSeconds: row.duration_seconds || row.durationSeconds || 0,
            audioUrl: row.audio_url || row.audioUrl || row.url || ""
          }
        ];

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
      });
    }
  } catch (e) {
    console.warn("Notice: Supabase 'stories' table not queried or not present", e);
  }

  // 2. Scan files in Supabase Storage Bucket to automatically make uploaded audio files playable!
  try {
    const { data: files, error } = await supabase.storage.from(config.bucket).list('', { limit: 100 });
    if (!error && Array.isArray(files) && files.length > 0) {
      // Separate image files from audio/video media files
      const imageFiles = files.filter(f => f.name.match(/\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i));
      
      // Default cover URL from bucket image if available
      let bucketCoverUrl = "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600";
      if (imageFiles.length > 0) {
        const firstImg = imageFiles[0].name;
        const { data: { publicUrl: imgUrl } } = supabase.storage.from(config.bucket).getPublicUrl(firstImg);
        if (imgUrl) {
          bucketCoverUrl = imgUrl;
        }
      }

      // Audio/Media files are any files that are NOT images and not placeholders
      const audioFiles = files.filter(f => 
        !f.name.match(/\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i) &&
        !f.name.startsWith('.') &&
        f.name !== 'emptyFolderPlaceholder'
      );

      audioFiles.forEach((file) => {
        const { data: { publicUrl } } = supabase.storage.from(config.bucket).getPublicUrl(file.name);
        
        // Clean title from filename (e.g. "1784811274388-poudam3.mp3" -> "Poudam3")
        let rawName = file.name.replace(/^\d+[-_]*/, "").replace(/\.[^/.]+$/, "");
        if (!rawName || rawName.trim().length === 0) {
          rawName = file.name.replace(/\.[^/.]+$/, "");
        }
        const formattedTitle = rawName
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, l => l.toUpperCase());

        // Check if story with this title or url is already in stories array
        const exists = stories.some(s => 
          s.id === `sp-storage-${file.name}` ||
          s.chapters.some(c => c.audioUrl === publicUrl)
        );

        if (!exists) {
          stories.push({
            id: `sp-storage-${file.name}`,
            title: formattedTitle || "Simulizi ya Supabase",
            subtitle: "Simulizi kutoka Supabase Storage",
            author: "Kendrick",
            creatorHandle: "@Kendrick",
            narrator: "Kendrick",
            category: "Simulizi",
            rating: 5.0,
            description: `Simulizi ya sauti inayopatikana kwenye Supabase Storage bucket (${config.bucket}).`,
            coverUrl: bucketCoverUrl,
            accentColor: "#CCE4F5",
            narratorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
            chapters: [
              {
                id: 1,
                title: `Sura ya 1: ${formattedTitle || "Audio Track"}`,
                duration: "Simulizi Sauti",
                durationSeconds: 0,
                audioUrl: publicUrl
              }
            ]
          });
        }
      });
    }
  } catch (e) {
    console.warn("Notice: Error scanning Supabase Storage bucket", e);
  }

  return stories;
}

// Save or Sync story object to Supabase database table 'stories'
export async function saveStoryToSupabase(story: Story): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
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
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('stories').upsert(payload);
    if (error) {
      console.warn("Could not upsert into Supabase 'stories' table:", error.message);
      return false;
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

