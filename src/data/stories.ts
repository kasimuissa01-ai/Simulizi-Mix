export interface Chapter {
  id: number;
  title: string;
  duration: string; // Format "MM:SS"
  durationSeconds: number;
  audioUrl: string;
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  creatorHandle?: string;
  tiktokUrl?: string;
  instagramUrl?: string;
  narrator: string;
  category: string;
  rating: number;
  description: string;
  coverUrl: string;
  accentColor: string; // Neo-brutalist pastel background
  narratorAvatar: string;
  chapters: Chapter[];
}

export const STORIES: Story[] = [];

export const FEATURED_STORY: Story | null = null;

