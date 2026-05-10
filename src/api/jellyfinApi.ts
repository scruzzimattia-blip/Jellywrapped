import axios, { isAxiosError } from 'axios';

export const JELLYFIN_CLIENT_HEADER =
  'MediaBrowser Client="JellyfinWrapped", Device="Web", DeviceId="wrapped-web", Version="1.0.0"';

export interface JellyfinAuthResult {
  userId: string;
  userName: string;
  accessToken: string;
  primaryImageTag: string | null;
}

export interface JellyfinSession {
  userId: string;
  userName: string;
  accessToken: string;
  primaryImageTag: string | null;
  serverUrl: string;
  year: number;
}

const SESSION_KEY = 'jellyfin_session';

export function loadJellyfinSession(): JellyfinSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as JellyfinSession;
    if (s.userId && s.userName && s.accessToken) return s;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveJellyfinSession(s: JellyfinSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearJellyfinSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function loadSavedServerUrl(): string {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return '';
    const s = JSON.parse(raw) as { serverUrl?: string };
    return s.serverUrl ?? '';
  } catch {
    return '';
  }
}

export function buildUserAvatarUrl(
  jellyfinBase: string,
  userId: string,
  primaryImageTag: string | null
): string | null {
  if (!primaryImageTag) return null;
  const b = jellyfinBase.replace(/\/+$/, '');
  return `${b}/Users/${userId}/Images/Primary?tag=${encodeURIComponent(primaryImageTag)}&api_key=__TOKEN__`;
}

export function applyApiKey(url: string, accessToken: string): string {
  return url.replace('__TOKEN__', encodeURIComponent(accessToken));
}

export function buildItemPosterUrl(
  jellyfinBase: string,
  itemId: string,
  accessToken: string,
  fillWidth = 300
): string {
  const b = jellyfinBase.replace(/\/+$/, '');
  return `${b}/Items/${itemId}/Images/Primary?fillWidth=${fillWidth}&quality=90&api_key=${encodeURIComponent(accessToken)}`;
}

export function buildItemBackdropUrl(
  jellyfinBase: string,
  itemId: string,
  accessToken: string,
  fillWidth = 1280
): string {
  const b = jellyfinBase.replace(/\/+$/, '');
  return `${b}/Items/${itemId}/Images/Backdrop?fillWidth=${fillWidth}&quality=80&api_key=${encodeURIComponent(accessToken)}`;
}

/** Parse Jellyfin item id from Tracearr thumb_path when it embeds `/Items/{guid}/`. */
export function extractJellyfinItemIdFromPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const m = path.match(/Items\/([0-9a-fA-F-]{36})/);
  return m?.[1] ?? null;
}

export interface JellyfinItemDto {
  Id: string;
  Type?: string;
  SeriesId?: string;
  Name?: string;
}

export async function searchJellyfinItemByTitle(
  jellyfinBase: string,
  userId: string,
  accessToken: string,
  searchTerm: string,
  itemType: 'Movie' | 'Series'
): Promise<string | null> {
  const b = jellyfinBase.replace(/\/+$/, '');
  const url = `${b}/Users/${encodeURIComponent(userId)}/Items`;
  try {
    const res = await axios.get<{ Items?: Array<{ Id: string }> }>(url, {
      timeout: 20_000,
      headers: {
        'X-Emby-Authorization': JELLYFIN_CLIENT_HEADER,
        'X-Emby-Token': accessToken,
      },
      params: {
        searchTerm,
        IncludeItemTypes: itemType,
        Recursive: true,
        Limit: 1,
      },
      validateStatus: (s) => s === 200,
    });
    return res.data.Items?.[0]?.Id ?? null;
  } catch {
    return null;
  }
}

export async function fetchJellyfinItem(
  jellyfinBase: string,
  userId: string,
  itemId: string,
  accessToken: string
): Promise<JellyfinItemDto | null> {
  const b = jellyfinBase.replace(/\/+$/, '');
  const url = `${b}/Users/${encodeURIComponent(userId)}/Items/${encodeURIComponent(itemId)}`;
  try {
    const res = await axios.get<JellyfinItemDto>(url, {
      timeout: 20_000,
      headers: {
        'X-Emby-Authorization': JELLYFIN_CLIENT_HEADER,
        'X-Emby-Token': accessToken,
      },
      validateStatus: (s) => s === 200,
    });
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function authenticateJellyfin(
  jellyfinBase: string,
  username: string,
  password: string
): Promise<{ ok: true; data: JellyfinAuthResult } | { ok: false; error: 'auth' | 'network'; message: string }> {
  const b = jellyfinBase.replace(/\/+$/, '');
  const url = `${b}/Users/AuthenticateByName`;
  try {
    const res = await axios.post(
      url,
      { Username: username, Pw: password },
      {
        timeout: 30_000,
        headers: {
          'X-Emby-Authorization': JELLYFIN_CLIENT_HEADER,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: 'auth', message: 'Invalid username or password' };
    }
    if (res.status < 200 || res.status >= 300) {
      return {
        ok: false,
        error: 'network',
        message: (res.data as { message?: string })?.message ?? `HTTP ${res.status}`,
      };
    }
    const body = res.data as {
      User?: { Id?: string; Name?: string; PrimaryImageTag?: string };
      AccessToken?: string;
    };
    const u = body.User;
    const token = body.AccessToken;
    if (!u?.Id || !token) {
      return { ok: false, error: 'network', message: 'Unexpected Jellyfin response' };
    }
    return {
      ok: true,
      data: {
        userId: u.Id,
        userName: u.Name ?? username,
        accessToken: token,
        primaryImageTag: u.PrimaryImageTag ?? null,
      },
    };
  } catch (e) {
    if (isAxiosError(e) && !e.response) {
      return { ok: false, error: 'network', message: 'Could not reach Jellyfin server.' };
    }
    return {
      ok: false,
      error: 'network',
      message: e instanceof Error ? e.message : 'Could not reach Jellyfin server.',
    };
  }
}
