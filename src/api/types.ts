export interface TracearrHistoryRow {
  id: string;
  serverId: string;
  serverName?: string;
  mediaType?: string;
  mediaTitle?: string;
  showTitle?: string | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  year?: number | null;
  posterUrl?: string | null;
  thumbPath?: string | null;
  durationMs?: number | null;
  startedAt?: string | null;
  stoppedAt?: string | null;
  segmentCount?: number;
  device?: string | null;
  player?: string | null;
  product?: string | null;
  platform?: string | null;
  user?: {
    id?: string;
    username?: string | null;
  };
  genres?: string[];
  genre?: string | null;
  /** If Tracearr exposes Jellyfin / Plex rating key */
  ratingKey?: string | null;
  itemId?: string | null;
  mediaItemId?: string | null;
}

export interface TracearrUserRow {
  id: string;
  username: string;
  displayName?: string;
  serverId: string;
  serverName?: string;
}

export interface TracearrServerRow {
  id: string;
  name?: string;
  type?: string;
  url?: string;
  online?: boolean;
}

export interface TracearrHealthResponse {
  status?: string;
  servers?: TracearrServerRow[];
}

export interface MediaItem {
  itemId: string;
  seriesId?: string;
  title: string;
  seriesTitle?: string;
  year?: number;
  playCount: number;
  /** Distinct episodes watched (series only). */
  episodeCount?: number;
  totalMinutes: number;
  posterUrl: string;
  backdropUrl?: string;
}

export interface GenreItem {
  genre: string;
  count: number;
}

export interface DeviceItem {
  name: string;
  count: number;
}

export interface MonthItem {
  month: number;
  label: string;
  topTitle: string;
  count: number;
  posterUrl: string;
  itemId: string;
  seriesId?: string;
}

export interface BingeSession {
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  titles: string[];
}

export interface HistoryItem {
  itemId: string;
  title: string;
  subtitle?: string;
  startedAt: string;
  posterUrl: string;
  seriesId?: string;
}

export type PersonalityType =
  | 'Movie Buff'
  | 'Series Addict'
  | 'Night Owl'
  | 'Binge Watcher'
  | 'Weekend Warrior'
  | 'Genre Fanatic'
  | 'All-Rounder';

export interface WrappedData {
  user: string;
  avatarUrl: string | null;
  year: number;
  totalMinutes: number;
  totalSessions: number;
  episodeCount: number;
  topMovies: MediaItem[];
  topShows: MediaItem[];
  topGenres: GenreItem[];
  hourHeatmap: number[];
  dayOfWeek: number[];
  deviceBreakdown: DeviceItem[];
  monthlyBreakdown: MonthItem[];
  bingeSessions: BingeSession[];
  mostReplayedItem: MediaItem;
  firstWatch: HistoryItem;
  lastWatch: HistoryItem;
  emptyYear: boolean;
  personalityType: PersonalityType;
}

export type OpenAPISpec = {
  openapi?: string;
  swagger?: string;
  servers?: { url: string }[];
  paths?: Record<string, Record<string, unknown>>;
  components?: {
    securitySchemes?: Record<string, { type?: string; scheme?: string; in?: string; name?: string }>;
  };
};

export interface ApiRouteMap {
  /** Preferred validation endpoint (servers list or health). */
  validate: string;
  users: string;
  history: string;
}

export type AuthStyle = 'bearer' | 'apiKey';
