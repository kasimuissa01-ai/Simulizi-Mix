/**
 * Client-Side Video to Audio Extractor & Converter
 * 
 * Extracts audio directly from uploaded video files (MP4, MOV, WEBM, MKV, AVI, etc.)
 * in the browser before uploading to Supabase. This dramatically reduces file size
 * (e.g., 100MB MP4 -> ~3-5MB clean audio), saving bandwidth and storage space.
 */

// Format numbers nicely (e.g., 12.4 MB)
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Check if a file is a video file based on MIME type or extension
export function isVideoFile(file: File): boolean {
  if (file.type && file.type.startsWith("video/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ["mp4", "mov", "webm", "mkv", "avi", "flv", "3gp", "wmv", "m4v"].includes(ext || "");
}

/**
 * Converts PCM AudioBuffer to a compact 16-bit WAV audio Blob
 */
export function audioBufferToWavBlob(audioBuffer: AudioBuffer, targetSampleRate = 22050): Blob {
  const originalLength = audioBuffer.length;
  const originalSampleRate = audioBuffer.sampleRate;
  
  // Resample ratio
  const ratio = targetSampleRate / originalSampleRate;
  const newLength = Math.round(originalLength * ratio);
  
  // Extract and mix channels to mono for 50% space savings
  const left = audioBuffer.getChannelData(0);
  const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null;
  
  const samples = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const originIndex = Math.min(Math.floor(i / ratio), originalLength - 1);
    if (right) {
      samples[i] = (left[originIndex] + right[originIndex]) / 2;
    } else {
      samples[i] = left[originIndex];
    }
  }

  // 16-bit PCM WAV Header (44 bytes)
  const numOfChannels = 1; // Mono
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numOfChannels * bytesPerSample;
  const byteRate = targetSampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + dataSize, true);
  /* WAVE identifier */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM = 1) */
  view.setUint16(20, 1, true);
  /* channel count (mono = 1) */
  view.setUint16(22, numOfChannels, true);
  /* sample rate */
  view.setUint32(24, targetSampleRate, true);
  /* byte rate */
  view.setUint32(28, byteRate, true);
  /* block align */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, dataSize, true);

  // Write PCM samples (clamped to 16-bit)
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export interface AudioExtractionResult {
  audioFile: File;
  originalSize: number;
  newSize: number;
  savedPercent: number;
  extractedName: string;
}

/**
 * Extracts audio from a video file automatically.
 * Returns the extracted lightweight audio File ready for database/storage upload.
 */
export async function extractAudioFromVideo(
  file: File,
  onStatusUpdate?: (status: string) => void
): Promise<AudioExtractionResult> {
  const originalSize = file.size;
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const extractedName = `${baseName}_audio.wav`;

  onStatusUpdate?.("Reading video file...");

  try {
    onStatusUpdate?.("Decoding video audio stream...");
    const arrayBuffer = await file.arrayBuffer();

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Web Audio API decodeAudioData decodes the embedded audio track directly
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    onStatusUpdate?.("Extracting & compressing audio track to clean mono WAV...");
    
    // Choose optimal sample rate based on length (22.05kHz is ideal for spoken storytelling)
    const wavBlob = audioBufferToWavBlob(audioBuffer, 22050);
    const audioFile = new File([wavBlob], extractedName, { type: "audio/wav" });
    
    await audioCtx.close();

    const newSize = audioFile.size;
    const savedPercent = Math.max(0, Math.round((1 - newSize / originalSize) * 100));

    return {
      audioFile,
      originalSize,
      newSize,
      savedPercent,
      extractedName
    };
  } catch (err) {
    console.warn("AudioContext decodeAudioData fallback activated:", err);
    
    onStatusUpdate?.("Using media player stream extraction...");
    const fallbackBlob = await extractAudioViaMediaRecorder(file, onStatusUpdate);
    const fallbackName = `${baseName}_audio.webm`;
    const audioFile = new File([fallbackBlob], fallbackName, { type: "audio/webm" });

    const newSize = audioFile.size;
    const savedPercent = Math.max(0, Math.round((1 - newSize / originalSize) * 100));

    return {
      audioFile,
      originalSize,
      newSize,
      savedPercent,
      extractedName: fallbackName
    };
  }
}

async function extractAudioViaMediaRecorder(
  file: File,
  onStatusUpdate?: (status: string) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.src = URL.createObjectURL(file);
    video.muted = false;

    video.onloadeddata = async () => {
      try {
        let stream: MediaStream;
        if ((video as any).captureStream) {
          stream = (video as any).captureStream();
        } else if ((video as any).mozCaptureStream) {
          stream = (video as any).mozCaptureStream();
        } else {
          throw new Error("Browser stream capture not supported");
        }

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          throw new Error("No audio track found in video");
        }

        const audioStream = new MediaStream(audioTracks);
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const mediaRecorder = new MediaRecorder(audioStream, { mimeType, audioBitsPerSecond: 64000 });
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          URL.revokeObjectURL(video.src);
          const finalBlob = new Blob(chunks, { type: mimeType });
          resolve(finalBlob);
        };

        mediaRecorder.onerror = (e) => {
          URL.revokeObjectURL(video.src);
          reject(e);
        };

        onStatusUpdate?.("Recording audio stream...");
        video.currentTime = 0;
        mediaRecorder.start();
        video.playbackRate = 2.0; // Fast extraction
        await video.play();

        video.onended = () => {
          mediaRecorder.stop();
        };
      } catch (err) {
        URL.revokeObjectURL(video.src);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Unable to parse video file."));
    };
  });
}
