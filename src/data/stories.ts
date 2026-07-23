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

export const STORIES: Story[] = [
  {
    id: "simulizi-ya-kendrick",
    title: "Simulizi za Kendrick",
    subtitle: "Kipindi cha Kwanza: Mwanzo wa Safari ya Sauti",
    author: "Kendrick",
    creatorHandle: "@KendrickOfficial",
    tiktokUrl: "https://www.tiktok.com/@kendrick",
    instagramUrl: "https://www.instagram.com/kendrick",
    narrator: "Kendrick",
    category: "Simulizi",
    rating: 5.0,
    description: "Sikiliza simulizi ya kusisimua iliyosimuliwa kwa ufundi wa pekee na Kendrick. Hii ni sehemu ya kwanza katika mfululizo wa masimulizi na vitabu vya sauti vya Kiswahili.",
    coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800",
    accentColor: "#CCE4F5", // Light Sky Blue
    narratorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
    chapters: [
      { id: 1, title: "Sura ya 1: Utangulizi na Mwanzo wa Safari", duration: "12:10", durationSeconds: 730, audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { id: 2, title: "Sura ya 2: Siri ya sauti na hekima", duration: "15:40", durationSeconds: 940, audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { id: 3, title: "Sura ya 3: Safari kuelekea kileleni", duration: "18:20", durationSeconds: 1100, audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
    ]
  }
];

export const FEATURED_STORY = STORIES[0];
