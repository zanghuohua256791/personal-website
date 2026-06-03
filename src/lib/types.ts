export interface Travel {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  location: string;
  travel_date: string;
  tags: string[];
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface TravelPhoto {
  id: string;
  travel_id: string;
  url: string;
  caption: string | null;
  sort_order: number;
}

export interface Movie {
  id: string;
  title: string;
  slug: string;
  poster_url: string | null;
  year: number | null;
  overview: string | null;
  rating: number | null;
  review: string | null;
  watched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  title: string;
  cover_url: string | null;
  platform: string[];
  status: "want_to_play" | "playing" | "completed" | "dropped";
  rating: number | null;
  steam_url: string | null;
  categories: string[];
  review: string | null;
  play_time: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const GAME_STATUS_MAP: Record<Game["status"], string> = {
  want_to_play: "想玩",
  playing: "在玩",
  completed: "已通关",
  dropped: "弃坑",
};

export const GAME_STATUS_COLORS: Record<Game["status"], string> = {
  want_to_play: "bg-gray-200 text-gray-700",
  playing: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  dropped: "bg-red-100 text-red-600",
};

export interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  photo_count: number;
  event_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  album_id: string;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  taken_at: string | null;
  created_at: string;
}
