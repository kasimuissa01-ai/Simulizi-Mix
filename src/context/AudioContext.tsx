import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Story, Chapter } from "../data/stories";
import { getPlayableAudioUrl } from "../lib/offlineStorage";

interface AudioContextType {
  currentStory: Story | null;
  currentChapter: Chapter | null;
  currentChapterIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  playStory: (story: Story, chapterIndex?: number) => void;
  pauseStory: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  nextChapter: () => void;
  prevChapter: () => void;
  skipSeconds: (seconds: number) => void;
  setSpeed: (speed: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentChapter = currentStory ? currentStory.chapters[currentChapterIndex] : null;

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio();
    
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || currentChapter?.durationSeconds || 0);
    };

    const handleEnded = () => {
      // Auto-advance or stop
      if (currentStory && currentChapterIndex < currentStory.chapters.length - 1) {
        setCurrentChapterIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, [currentStory, currentChapterIndex]);

  // Handle URL change
  useEffect(() => {
    if (!audioRef.current || !currentChapter) return;

    const audio = audioRef.current;
    let isCancelled = false;

    getPlayableAudioUrl(currentChapter.audioUrl).then((resolvedUrl) => {
      if (isCancelled) return;

      const isSameSource = audio.src === resolvedUrl;

      if (!isSameSource) {
        audio.src = resolvedUrl;
        audio.load();
        audio.playbackRate = playbackSpeed;
      }

      if (isPlaying) {
        audio.play().catch((err) => {
          console.warn("Audio autoplay blocked or failed:", err);
          setIsPlaying(false);
        });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [currentChapter]);

  // Handle Play/Pause changes
  useEffect(() => {
    if (!audioRef.current || !currentChapter) return;

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn("Audio play failed:", err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle Playback speed change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const playStory = (story: Story, chapterIndex = 0) => {
    if (currentStory?.id === story.id && currentChapterIndex === chapterIndex) {
      setIsPlaying(true);
    } else {
      setCurrentStory(story);
      setCurrentChapterIndex(chapterIndex);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const pauseStory = () => {
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!currentStory) return;
    setIsPlaying(!isPlaying);
  };

  const seek = (seconds: number) => {
    if (audioRef.current && currentChapter) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const nextChapter = () => {
    if (currentStory && currentChapterIndex < currentStory.chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      setCurrentTime(0);
    }
  };

  const prevChapter = () => {
    if (currentStory && currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      setCurrentTime(0);
    } else if (audioRef.current) {
      // Seek to start if on first chapter or just click prev
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const skipSeconds = (seconds: number) => {
    if (audioRef.current) {
      let newTime = audioRef.current.currentTime + seconds;
      if (newTime < 0) newTime = 0;
      if (newTime > duration) newTime = duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const setSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  return (
    <AudioContext.Provider
      value={{
        currentStory,
        currentChapter,
        currentChapterIndex,
        isPlaying,
        currentTime,
        duration,
        playbackSpeed,
        playStory,
        pauseStory,
        togglePlay,
        seek,
        nextChapter,
        prevChapter,
        skipSeconds,
        setSpeed,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
