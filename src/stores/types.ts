export interface Game {
  id: number;
  title: string;
  system_id: number;
  rom_path: string;
  filename?: string;
  crc32?: string;
  is_favorite: number;
  video_path?: string;
  image_path?: string;
  wheel_path?: string;
  marquee_path?: string;
  description?: string;
  developer?: string;
  publisher?: string;
  year?: number;
  players?: number;
  genre?: string;
  play_count?: number;
  total_play_time?: number;
  last_played?: string;
  rating?: number;
  buttons?: number;
  control_type?: string;
  joystick_direction?: string;
  category?: string;
  orientation?: string;
}

export interface System {
  id: number;
  name: string;
  display_name: string;
  extensions: string;
}

export interface SaveState {
  id: number;
  game_id: number;
  slot: number;
  save_path: string;
  thumbnail?: string;
  description?: string;
  play_time?: number;
  created_at?: string;
}

export type View = "menu" | "systems" | "games" | "operator" | "settings";

export type SortField = "title" | "year" | "genre" | "play_count" | "rating";
export type SortOrder = "asc" | "desc";
