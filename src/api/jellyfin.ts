import axios from 'axios';
import { JELLYFIN_CLIENT_HEADER } from './jellyfinApi';

export interface JellyfinWatchedItem {
  id: string;
  name: string;
  type: 'Movie' | 'Episode';
  seriesName?: string;
  seriesId?: string;
  runTimeTicks?: number;
  genres: string[];
  playCount: number;
  lastPlayedDate?: string;
  imageTag?: string;
  primaryImageItemId?: string;
}

interface RawItem {
  Id: string;
  Name: string;
  Type: string;
  SeriesName?: string;
  SeriesId?: string;
  RunTimeTicks?: number;
  Genres?: string[];
  UserData?: {
    PlayCount?: number;
    Played?: boolean;
    LastPlayedDate?: string;
  };
  ImageTags?: Record<string, string>;
  SeriesPrimaryImageTag?: string;
}

interface ItemsResponse {
  Items: RawItem[];
  TotalRecordCount: number;
}

export async function fetchWatchedItems(
  serverUrl: string,
  userId: string,
  accessToken: string,
  year: number
): Promise<JellyfinWatchedItem[]> {
  const base = serverUrl.replace(/\/+$/, '');
  const url = `${base}/Users/${encodeURIComponent(userId)}/Items`;

  const startDate = `${year}-01-01T00:00:00Z`;
  const endDate = `${year}-12-31T23:59:59Z`;

  const allItems: RawItem[] = [];
  let startIndex = 0;
  const limit = 500;

  for (;;) {
    const res = await axios.get<ItemsResponse>(url, {
      timeout: 60_000,
      headers: {
        'X-Emby-Authorization': JELLYFIN_CLIENT_HEADER,
        'X-Emby-Token': accessToken,
      },
      params: {
        Filters: 'IsPlayed',
        Recursive: true,
        IncludeItemTypes: 'Movie,Episode',
        Fields: 'UserData,Genres,SeriesName,RunTimeTicks,SeriesPrimaryImageTag',
        SortBy: 'DatePlayed',
        SortOrder: 'Descending',
        MinDateLastSaved: startDate,
        MaxDateLastSaved: endDate,
        StartIndex: startIndex,
        Limit: limit,
      },
      validateStatus: (s) => s === 200,
    });

    const chunk = res.data.Items ?? [];
    allItems.push(...chunk);

    if (chunk.length < limit || allItems.length >= res.data.TotalRecordCount) break;
    startIndex += limit;
  }

  const yearStr = String(year);
  const filtered = allItems.filter((item) => {
    const d = item.UserData?.LastPlayedDate;
    if (!d) return false;
    return d.startsWith(yearStr);
  });

  return filtered.map((item): JellyfinWatchedItem => ({
    id: item.Id,
    name: item.Name,
    type: (item.Type === 'Movie' ? 'Movie' : 'Episode') as 'Movie' | 'Episode',
    seriesName: item.SeriesName,
    seriesId: item.SeriesId,
    runTimeTicks: item.RunTimeTicks,
    genres: item.Genres ?? [],
    playCount: item.UserData?.PlayCount ?? 1,
    lastPlayedDate: item.UserData?.LastPlayedDate,
    imageTag: item.ImageTags?.Primary,
    primaryImageItemId: item.SeriesId ?? item.Id,
  }));
}

export function buildPosterUrl(
  serverUrl: string,
  itemId: string,
  accessToken: string,
  width = 300
): string {
  const base = serverUrl.replace(/\/+$/, '');
  return `${base}/Items/${itemId}/Images/Primary?fillWidth=${width}&quality=90&api_key=${encodeURIComponent(accessToken)}`;
}

export function buildBackdropUrl(
  serverUrl: string,
  itemId: string,
  accessToken: string,
  width = 1280
): string {
  const base = serverUrl.replace(/\/+$/, '');
  return `${base}/Items/${itemId}/Images/Backdrop?fillWidth=${width}&quality=80&api_key=${encodeURIComponent(accessToken)}`;
}
