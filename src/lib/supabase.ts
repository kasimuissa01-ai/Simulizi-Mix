import { createClient } from "@supabase/supabase-js";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  bucket: string;
}

// Get the config from environment or localStorage
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";
  
  const localConfig = localStorage.getItem("simulizi_supabase_config");
  if (localConfig) {
    try {
      const parsed = JSON.parse(localConfig);
      return {
        url: parsed.url || envUrl,
        anonKey: parsed.anonKey || envKey,
        bucket: parsed.bucket || "simulizi-audio"
      };
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

// Function to upload a file to Supabase Storage
export async function uploadToSupabase(file: File): Promise<string> {
  const config = getSupabaseConfig();
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    throw new Error("Supabase is not configured yet. Please configure it in Settings first.");
  }

  // Create unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload the file
  const { data, error } = await supabase.storage
    .from(config.bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(config.bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}
