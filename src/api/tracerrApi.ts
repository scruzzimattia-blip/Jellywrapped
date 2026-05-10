import axios, { type AxiosInstance, isAxiosError } from 'axios';
import type { TracearrAdminConfig } from '@/adminStorage';
import {
  buildItemBackdropUrl,
  buildItemPosterUrl,
  extractJellyfinItemIdFromPath,
  fetchJellyfinItem,
  searchJellyfinItemByTitle,
  type JellyfinSession,
} from '@/api/jellyfinApi';
import type {
  ApiRouteMap,
  AuthStyle,
  OpenAPISpec,
  PersonalityType,
  TracearrHealthResponse,
  TracearrHistoryRow,
  TracearrServerRow,
  TracearrUserRow,
  WrappedData,
} from './types';

export interface FetchWrappedContext {
  admin: TracearrAdminConfig;
  jellyfin: JellyfinSession;
}

interface DiscoveryCache {
  spec: OpenAPISpec;
  routes: ApiRouteMap;
  serverUrl: string;
  auth: { style: AuthStyle; headerName?: string };
}

const DISCOVERY_CACHE = new Map<string, DiscoveryCache>();

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function detectAuthFromSpec(spec: OpenAPISpec): { style: AuthStyle; headerName?: string } {
  const schemes = spec.components?.securitySchemes ?? {};
  for (const def of Object.values(schemes)) {
    if (def?.type === 'http' && def.scheme?.toLowerCase() === 'bearer') {
      return { style: 'bearer' };
    }
    if (def?.type === 'apiKey' && def.in === 'header' && def.name) {
      return { style: 'apiKey', headerName: def.name };
    }
  }
  return { style: 'apiKey', headerName: 'X-Api-Key' };
}

function findGetPath(spec: OpenAPISpec, includes: string): string | null {
  const paths = spec.paths ?? {};
  for (const [p, methods] of Object.entries(paths)) {
    const get = methods.get ?? (methods as { GET?: unknown }).GET;
    if (get && p.includes(includes)) {
      return p;
    }
  }
  return null;
}

function buildRouteMap(spec: OpenAPISpec): ApiRouteMap | null {
  const servers = findGetPath(spec, '/servers');
  const health = findGetPath(spec, '/health');
  const users = findGetPath(spec, '/users');
  const history = findGetPath(spec, '/history');
  if (!users || !history) return null;
  const validate = servers ?? health;
  if (!validate) return null;
  return { validate, users, history };
}

const FALLBACK_ROUTES: ApiRouteMap = {
  validate: '/api/v1/public/health',
  users: '/api/v1/public/users',
  history: '/api/v1/public/history',
};

const OPENAPI_CANDIDATES = [
  '/api-docs/json',
  '/api-docs',
  '/api/v1/public/docs',
  '/openapi.json',
  '/swagger.json',
];

function headerVariants(apiKey: string): Record<string, string>[] {
  const token = apiKey.startsWith('Bearer ') ? apiKey.slice(7) : apiKey;
  return [
    { 'X-Api-Key': token },
    { Authorization: `Bearer ${token}` },
    {},
  ];
}

async function fetchOpenAPISpec(
  tracearrBase: string,
  apiKey: string
): Promise<{ spec: OpenAPISpec; serverUrl: string } | null> {
  const base = normalizeBaseUrl(tracearrBase);
  for (const headers of headerVariants(apiKey)) {
    const client = axios.create({ timeout: 60_000, headers });
    for (const cand of OPENAPI_CANDIDATES) {
      try {
        const url = joinUrl(base, cand);
        const { data } = await client.get<OpenAPISpec>(url, {
          validateStatus: (s) => s === 200,
        });
        if (data && (data.openapi || data.swagger) && data.paths) {
          const serverUrl =
            data.servers?.[0]?.url != null && data.servers[0].url !== ''
              ? data.servers[0].url.replace(/\/$/, '')
              : base;
          return { spec: data, serverUrl };
        }
      } catch {
        /* try next */
      }
    }
  }
  return null;
}

function buildAuthHeaders(
  apiKey: string,
  auth: { style: AuthStyle; headerName?: string }
): Record<string, string> {
  if (auth.style === 'apiKey' && auth.headerName) {
    const raw = apiKey.startsWith('Bearer ') ? apiKey.slice(7) : apiKey;
    return { [auth.headerName]: raw };
  }
  const token = apiKey.startsWith('Bearer ') ? apiKey.slice(7) : apiKey;
  return { Authorization: `Bearer ${token}` };
}

async function ensureDiscovery(
  tracearrBase: string,
  apiKey: string
): Promise<{ spec: OpenAPISpec; routes: ApiRouteMap; serverUrl: string; auth: { style: AuthStyle; headerName?: string } }> {
  const base = normalizeBaseUrl(tracearrBase);
  const cacheKey = base;
  const hit = DISCOVERY_CACHE.get(cacheKey);
  if (hit) {
    return { spec: hit.spec, routes: hit.routes, serverUrl: hit.serverUrl, auth: hit.auth };
  }

  const discovered = await fetchOpenAPISpec(base, apiKey);
  let spec = discovered?.spec ?? null;
  let serverUrl = discovered?.serverUrl ?? base;

  let routes: ApiRouteMap | null = spec ? buildRouteMap(spec) : null;
  let auth = spec ? detectAuthFromSpec(spec) : { style: 'apiKey' as const, headerName: 'X-Api-Key' };

  if (!routes) {
    routes = FALLBACK_ROUTES;
    auth = { style: 'bearer' };
    spec = spec ?? {
      openapi: '3.0.0',
      paths: {
        [FALLBACK_ROUTES.validate]: { get: {} },
        [FALLBACK_ROUTES.users]: { get: {} },
        [FALLBACK_ROUTES.history]: { get: {} },
      },
      components: {
        securitySchemes: {
          apiKey: { type: 'apiKey', in: 'header', name: 'X-Api-Key' },
          bearerAuth: { type: 'http', scheme: 'bearer' },
        },
      },
    };
    serverUrl = base;
  }

  const resolvedSpec = spec!;
  DISCOVERY_CACHE.set(cacheKey, { spec: resolvedSpec, routes, serverUrl, auth });

  return { spec: resolvedSpec, routes, serverUrl, auth };
}

function requestUrl(serverUrl: string, openApiPath: string): string {
  return joinUrl(serverUrl, openApiPath);
}

async function withBackoff<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let delay = 500;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 429) {
        const retryAfter = Number(e.response.headers['retry-after']);
        const waitMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : delay;
        await sleep(waitMs);
        delay = Math.min(delay * 2, 30_000);
        continue;
      }
      throw e;
    }
  }
  throw new Error(`${label}: rate limited after retries`);
}

function parseServersPayload(data: unknown): TracearrServerRow[] {
  if (Array.isArray(data)) return data as TracearrServerRow[];
  if (!data || typeof data !== 'object') return [];
  const d = data as { servers?: TracearrServerRow[]; data?: TracearrServerRow[] };
  if (Array.isArray(d.servers)) return d.servers;
  if (Array.isArray(d.data)) return d.data;
  return [];
}

export interface ValidateTracearrResult {
  ok: true;
  servers: TracearrServerRow[];
}
export interface ValidateTracearrError {
  ok: false;
  status: number;
  message: string;
}

export async function validateTracearrOnSave(
  tracearrBase: string,
  apiKey: string
): Promise<ValidateTracearrResult | ValidateTracearrError> {
  const { routes, serverUrl, auth } = await ensureDiscovery(tracearrBase, apiKey);
  const headers = buildAuthHeaders(apiKey, auth);
  const url = requestUrl(serverUrl, routes.validate);
  try {
    const res = await axios.get<unknown>(url, {
      headers,
      timeout: 30_000,
      validateStatus: () => true,
    });
    if (res.status >= 200 && res.status < 300) {
      let servers = parseServersPayload(res.data);
      if (servers.length === 0) {
        const h = res.data as TracearrHealthResponse;
        servers = h.servers ?? [];
      }
      return { ok: true, servers };
    }
    const msg =
      (res.data as { error?: string; message?: string })?.message ??
      (res.data as { error?: string })?.error ??
      res.statusText;
    return { ok: false, status: res.status, message: msg || 'Request failed' };
  } catch (e) {
    if (isAxiosError(e)) {
      const status = e.response?.status ?? 0;
      const data = e.response?.data as { message?: string; error?: string } | undefined;
      const message = data?.message ?? data?.error ?? e.message;
      return { ok: false, status, message };
    }
    throw e;
  }
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return '';
  }
}

function pickJellyfinServerId(servers: TracearrServerRow[], configuredJellyfinUrl: string): string | null {
  const jelly = servers.filter((s) => (s.type ?? '').toLowerCase() === 'jellyfin');
  if (jelly.length === 0) return null;
  const wantHost = hostOf(configuredJellyfinUrl);
  if (wantHost) {
    for (const s of jelly) {
      if (s.url && hostOf(s.url) === wantHost) return s.id;
    }
  }
  return jelly[0]!.id;
}

interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; pageSize: number };
}

async function fetchAllPages<T>(
  client: AxiosInstance,
  serverUrl: string,
  openApiPath: string,
  baseParams: Record<string, string | number | undefined>
): Promise<T[]> {
  const url = requestUrl(serverUrl, openApiPath);
  const out: T[] = [];
  let page = 1;
  const pageSize = 100;
  for (;;) {
    const res = await withBackoff(
      () =>
        client.get<Paginated<T>>(url, {
          params: { ...baseParams, page, pageSize },
        }),
      `GET ${openApiPath}`
    );
    const chunk = res.data.data ?? [];
    out.push(...chunk);
    const total = res.data.meta?.total ?? out.length;
    if (chunk.length < pageSize || out.length >= total) break;
    page += 1;
  }
  return out;
}

function rowItemId(row: TracearrHistoryRow): string {
  return (
    row.itemId ??
    row.mediaItemId ??
    row.ratingKey ??
    extractJellyfinItemIdFromPath(row.thumbPath) ??
    ''
  );
}

function titleForRow(row: TracearrHistoryRow): string {
  const mt = (row.mediaType ?? '').toLowerCase();
  if (mt === 'episode' && row.showTitle) {
    return row.showTitle;
  }
  return row.mediaTitle ?? 'Unknown';
}

function subtitleForRow(row: TracearrHistoryRow): string | undefined {
  const mt = (row.mediaType ?? '').toLowerCase();
  if (mt === 'episode' && row.mediaTitle) {
    const parts: string[] = [];
    if (row.seasonNumber != null) parts.push(`S${row.seasonNumber}`);
    if (row.episodeNumber != null) parts.push(`E${row.episodeNumber}`);
    const se = parts.length ? parts.join('') : '';
    return se ? `${se} · ${row.mediaTitle}` : row.mediaTitle;
  }
  return undefined;
}

function displayItemKey(row: TracearrHistoryRow): string {
  const mt = (row.mediaType ?? '').toLowerCase();
  if (mt === 'episode') {
    return `episode:${row.showTitle ?? ''}:${row.mediaTitle ?? ''}:${row.seasonNumber ?? 0}:${row.episodeNumber ?? 0}`;
  }
  return `movie:${row.mediaTitle ?? ''}:${row.year ?? ''}`;
}

function genresFromRow(row: TracearrHistoryRow): string[] {
  if (row.genres?.length) return row.genres;
  if (row.genre) return [row.genre];
  return [];
}

function deviceLabel(row: TracearrHistoryRow): string {
  return (
    row.player?.trim() ||
    row.device?.trim() ||
    row.product?.trim() ||
    row.platform?.trim() ||
    'Unknown device'
  );
}

function parseTime(iso: string | null | undefined): number {
  if (!iso) return NaN;
  return new Date(iso).getTime();
}

function computeBinges(rows: TracearrHistoryRow[]): WrappedData['bingeSessions'] {
  const sorted = [...rows].sort((a, b) => parseTime(a.startedAt) - parseTime(b.startedAt));
  const GAP_MS = 30 * 60 * 1000;
  const MIN_MS = 3 * 60 * 60 * 1000;

  const sessions: WrappedData['bingeSessions'] = [];
  let cur: TracearrHistoryRow[] = [];

  const flush = () => {
    if (cur.length === 0) return;
    const start = cur[0].startedAt!;
    const endRow = cur[cur.length - 1];
    const endT = parseTime(endRow.stoppedAt) || parseTime(endRow.startedAt);
    const dur = cur.reduce((acc, r) => acc + (r.durationMs ?? 0), 0);
    if (dur >= MIN_MS) {
      const titles = [...new Set(cur.map((r) => titleForRow(r)))];
      sessions.push({
        startedAt: start,
        endedAt: new Date(endT).toISOString(),
        durationMinutes: Math.round(dur / 60000),
        titles,
      });
    }
    cur = [];
  };

  for (const row of sorted) {
    const s = parseTime(row.startedAt);
    if (Number.isNaN(s)) continue;

    if (cur.length === 0) {
      cur.push(row);
      continue;
    }
    const prev = cur[cur.length - 1];
    const prevEnd = parseTime(prev.stoppedAt) || parseTime(prev.startedAt) + (prev.durationMs ?? 0);
    if (s - prevEnd <= GAP_MS) {
      cur.push(row);
    } else {
      flush();
      cur = [row];
    }
  }
  flush();

  return sessions;
}

function emptyMediaItem(title: string): WrappedData['mostReplayedItem'] {
  return {
    itemId: '',
    title,
    playCount: 0,
    totalMinutes: 0,
    posterUrl: '',
  };
}

function emptyHistoryItem(title: string): WrappedData['firstWatch'] {
  return {
    itemId: '',
    title,
    startedAt: new Date(0).toISOString(),
    posterUrl: '',
  };
}

async function resolveSeriesIdsForEpisodes(
  jellyfinBase: string,
  userId: string,
  token: string,
  itemIds: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(itemIds.filter(Boolean))];
  for (const id of unique) {
    const dto = await fetchJellyfinItem(jellyfinBase, userId, id, token);
    if (dto?.SeriesId) out.set(id, dto.SeriesId);
    await sleep(40);
  }
  return out;
}

async function resolveItemIdsByTitle(
  jellyfinBase: string,
  userId: string,
  token: string,
  titles: string[],
  itemType: 'Movie' | 'Series'
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(titles.filter(Boolean))];
  for (const title of unique) {
    const id = await searchJellyfinItemByTitle(jellyfinBase, userId, token, title, itemType);
    if (id) out.set(title, id);
    await sleep(40);
  }
  return out;
}

function buildMediaItem(
  base: {
    itemId: string;
    seriesId?: string;
    title: string;
    seriesTitle?: string;
    year?: number;
    playCount: number;
    episodeCount?: number;
    totalMinutes: number;
  },
  jellyfinBase: string,
  token: string
): WrappedData['topMovies'][number] {
  const posterId = base.seriesId && base.seriesId !== base.itemId ? base.seriesId : base.itemId;
  const posterUrl = posterId
    ? buildItemPosterUrl(jellyfinBase, posterId, token)
    : '';
  const backdropUrl =
    base.itemId && base.itemId === posterId
      ? buildItemBackdropUrl(jellyfinBase, base.itemId, token)
      : base.itemId
        ? buildItemBackdropUrl(jellyfinBase, base.itemId, token)
        : undefined;
  return {
    itemId: base.itemId,
    seriesId: base.seriesId,
    title: base.title,
    seriesTitle: base.seriesTitle,
    year: base.year,
    playCount: base.playCount,
    episodeCount: base.episodeCount,
    totalMinutes: base.totalMinutes,
    posterUrl,
    backdropUrl,
  };
}

export async function fetchWrappedData(ctx: FetchWrappedContext): Promise<WrappedData> {
  const { admin, jellyfin } = ctx;
  const year = admin.year;
  const tracearrBase = admin.tracearrUrl;
  const apiKey = admin.tracearrApiKey;
  const jellyfinBase = admin.jellyfinUrl;

  const { routes, serverUrl, auth } = await ensureDiscovery(tracearrBase, apiKey);
  const headers = buildAuthHeaders(apiKey, auth);
  const client = axios.create({
    timeout: 120_000,
    headers,
  });

  const tz = getBrowserTimezone();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const v = await validateTracearrOnSave(tracearrBase, apiKey);
  if (!v.ok) {
    throw new Error(v.message);
  }

  const serverId = pickJellyfinServerId(v.servers, jellyfinBase);
  if (!serverId) {
    throw new Error('No Jellyfin server found in Tracearr for this account.');
  }

  const userRows = await fetchAllPages<TracearrUserRow>(client, serverUrl, routes.users, {
    serverId,
  });

  const jellyName = jellyfin.userName;
  const traceUser =
    userRows.find(
      (u) =>
        u.serverId === serverId &&
        (norm(u.displayName ?? '') === norm(jellyName) || norm(u.username) === norm(jellyName))
    ) ?? null;

  if (!traceUser) {
    throw new Error(
      "Your Jellyfin account isn't tracked in Tracearr yet. Make sure you've watched something recently."
    );
  }

  const traceUserId = traceUser.id;

  const rawHistory = await fetchAllPages<TracearrHistoryRow>(client, serverUrl, routes.history, {
    startDate,
    endDate,
    timezone: tz,
    serverId,
  });

  const filtered = rawHistory.filter((h) => h.user?.id === traceUserId);

  const totalMinutes = Math.round(filtered.reduce((a, r) => a + (r.durationMs ?? 0), 0) / 60000);
  const totalSessions = filtered.length;
  const emptyYear = totalSessions === 0;

  const movieRows = filtered.filter((r) => (r.mediaType ?? '').toLowerCase() === 'movie');
  const showRows = filtered.filter((r) => (r.mediaType ?? '').toLowerCase() === 'episode');

  const movieMap = new Map<
    string,
    { count: number; totalMinutes: number; row: TracearrHistoryRow }
  >();
  for (const r of movieRows) {
    const key = displayItemKey(r);
    const cur = movieMap.get(key);
    const dm = Math.round((r.durationMs ?? 0) / 60000);
    if (cur) {
      cur.count += 1;
      cur.totalMinutes += dm;
    } else {
      movieMap.set(key, { count: 1, totalMinutes: dm, row: r });
    }
  }

  const showMap = new Map<
    string,
    { playCount: number; episodes: Set<string>; totalMinutes: number; row: TracearrHistoryRow }
  >();
  for (const r of showRows) {
    const key = `show:${r.showTitle ?? r.mediaTitle ?? ''}`;
    const epKey = `${r.mediaTitle ?? ''}:${r.seasonNumber ?? 0}:${r.episodeNumber ?? 0}`;
    const dm = Math.round((r.durationMs ?? 0) / 60000);
    const cur = showMap.get(key);
    if (cur) {
      cur.playCount += 1;
      cur.episodes.add(epKey);
      cur.totalMinutes += dm;
    } else {
      showMap.set(key, { playCount: 1, episodes: new Set([epKey]), totalMinutes: dm, row: r });
    }
  }

  const episodeItemIds: string[] = [];
  const missingEpisodeShowTitles: string[] = [];
  for (const [, v] of showMap) {
    const id = rowItemId(v.row);
    if (id) {
      episodeItemIds.push(id);
    } else {
      const showTitle = v.row.showTitle ?? v.row.mediaTitle ?? '';
      if (showTitle) missingEpisodeShowTitles.push(showTitle);
    }
  }

  const seriesMap = await resolveSeriesIdsForEpisodes(
    jellyfinBase,
    jellyfin.userId,
    jellyfin.accessToken,
    episodeItemIds
  );

  const seriesByTitleMap = await resolveItemIdsByTitle(
    jellyfinBase,
    jellyfin.userId,
    jellyfin.accessToken,
    missingEpisodeShowTitles,
    'Series'
  );

  const missingMovieTitles: string[] = [];
  for (const [, v] of movieMap) {
    if (!rowItemId(v.row) && v.row.mediaTitle) {
      missingMovieTitles.push(v.row.mediaTitle);
    }
  }

  const movieByTitleMap = await resolveItemIdsByTitle(
    jellyfinBase,
    jellyfin.userId,
    jellyfin.accessToken,
    missingMovieTitles,
    'Movie'
  );

  const topMovies = [...movieMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([, v]) => {
      const iid = rowItemId(v.row) || movieByTitleMap.get(v.row.mediaTitle ?? '') || '';
      return buildMediaItem(
        {
          itemId: iid,
          title: v.row.mediaTitle ?? 'Unknown',
          year: v.row.year ?? undefined,
          playCount: v.count,
          totalMinutes: v.totalMinutes,
        },
        jellyfinBase,
        jellyfin.accessToken
      );
    });

  const topShows = [...showMap.entries()]
    .sort((a, b) => {
      const ep = b[1].episodes.size - a[1].episodes.size;
      if (ep !== 0) return ep;
      return b[1].playCount - a[1].playCount;
    })
    .slice(0, 5)
    .map(([, v]) => {
      const showTitle = v.row.showTitle ?? v.row.mediaTitle ?? 'Unknown';
      const iid = rowItemId(v.row);
      const sid = iid
        ? seriesMap.get(iid)
        : seriesByTitleMap.get(v.row.showTitle ?? v.row.mediaTitle ?? '');
      const effectiveItemId = iid || sid || '';
      return buildMediaItem(
        {
          itemId: effectiveItemId,
          seriesId: sid,
          title: showTitle,
          seriesTitle: v.row.showTitle ?? undefined,
          year: v.row.year ?? undefined,
          playCount: v.playCount,
          episodeCount: v.episodes.size,
          totalMinutes: v.totalMinutes,
        },
        jellyfinBase,
        jellyfin.accessToken
      );
    });

  const genreCount = new Map<string, number>();
  for (const r of filtered) {
    for (const g of genresFromRow(r)) {
      const k = g.trim();
      if (!k) continue;
      genreCount.set(k, (genreCount.get(k) ?? 0) + 1);
    }
  }
  if (genreCount.size === 0) {
    const movieMins = movieRows.reduce((a, r) => a + (r.durationMs ?? 0), 0);
    const showMins = showRows.reduce((a, r) => a + (r.durationMs ?? 0), 0);
    if (movieMins > showMins && movieMins > 0) genreCount.set('Feature films', movieRows.length);
    else if (showMins > 0) genreCount.set('Series & episodes', showRows.length);
  }

  const topGenres = [...genreCount.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const hourHeatmap = Array.from({ length: 24 }, () => 0);
  const dayOfWeek = Array.from({ length: 7 }, () => 0);
  for (const r of filtered) {
    const t = parseTime(r.startedAt);
    if (Number.isNaN(t)) continue;
    const d = new Date(t);
    hourHeatmap[d.getHours()] += 1;
    dayOfWeek[(d.getDay() + 6) % 7] += 1;
  }

  const deviceMap = new Map<string, number>();
  for (const r of filtered) {
    const lab = deviceLabel(r);
    deviceMap.set(lab, (deviceMap.get(lab) ?? 0) + 1);
  }
  const deviceBreakdown = [...deviceMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthCounts: Record<number, Map<string, { count: number; row: TracearrHistoryRow }>> = {};

  for (const r of filtered) {
    const t = parseTime(r.startedAt);
    if (Number.isNaN(t)) continue;
    const m = new Date(t).getMonth();
    const title = titleForRow(r);
    if (!monthCounts[m]) monthCounts[m] = new Map();
    const map = monthCounts[m]!;
    const cur = map.get(title);
    if (cur) cur.count += 1;
    else map.set(title, { count: 1, row: r });
  }

  const resolvePosterId = (row: TracearrHistoryRow): string => {
    const iid = rowItemId(row);
    const mt = (row.mediaType ?? '').toLowerCase();
    if (mt === 'episode') {
      if (iid) return seriesMap.get(iid) ?? iid;
      const showTitle = row.showTitle ?? row.mediaTitle ?? '';
      return seriesByTitleMap.get(showTitle) ?? '';
    }
    if (iid) return iid;
    return movieByTitleMap.get(row.mediaTitle ?? '') ?? '';
  };

  const monthlyBreakdown = monthLabels.map((label, i) => {
    const map = monthCounts[i];
    if (!map || map.size === 0) {
      return {
        month: i,
        label,
        topTitle: '—',
        count: 0,
        posterUrl: '',
        itemId: '',
      };
    }
    let best = { title: '', count: -1, row: null as TracearrHistoryRow | null };
    for (const [title, v] of map.entries()) {
      if (v.count > best.count) best = { title, count: v.count, row: v.row };
    }
    const row = best.row!;
    const iid = rowItemId(row);
    const posterId = resolvePosterId(row);
    const sid =
      (row.mediaType ?? '').toLowerCase() === 'episode'
        ? (iid ? seriesMap.get(iid) : seriesByTitleMap.get(row.showTitle ?? row.mediaTitle ?? ''))
        : undefined;
    return {
      month: i,
      label,
      topTitle: best.title,
      count: best.count,
      posterUrl: posterId ? buildItemPosterUrl(jellyfinBase, posterId, jellyfin.accessToken) : '',
      itemId: iid,
      seriesId: sid,
    };
  });

  const bingeSessions = computeBinges(filtered);

  const replayMap = new Map<string, { count: number; row: TracearrHistoryRow; minutes: number }>();
  for (const r of filtered) {
    const key = displayItemKey(r);
    const cur = replayMap.get(key);
    const dm = Math.round((r.durationMs ?? 0) / 60000);
    if (cur) {
      cur.count += 1;
      cur.minutes += dm;
    } else {
      replayMap.set(key, { count: 1, row: r, minutes: dm });
    }
  }
  let mostReplayedItem = emptyMediaItem('—');
  let bestReplay = 0;
  for (const [, v] of replayMap) {
    if (v.count > bestReplay) {
      bestReplay = v.count;
      const r = v.row;
      const iid = rowItemId(r);
      const posterId = resolvePosterId(r);
      const sid =
        (r.mediaType ?? '').toLowerCase() === 'episode'
          ? (iid ? seriesMap.get(iid) : seriesByTitleMap.get(r.showTitle ?? r.mediaTitle ?? ''))
          : undefined;
      mostReplayedItem = buildMediaItem(
        {
          itemId: iid || posterId,
          seriesId: sid,
          title: titleForRow(r),
          seriesTitle: r.showTitle ?? undefined,
          year: r.year ?? undefined,
          playCount: v.count,
          totalMinutes: v.minutes,
        },
        jellyfinBase,
        jellyfin.accessToken
      );
    }
  }

  let firstWatch = emptyHistoryItem('—');
  let lastWatch = emptyHistoryItem('—');
  let minT = Infinity;
  let maxT = -Infinity;
  for (const r of filtered) {
    const t = parseTime(r.startedAt);
    if (Number.isNaN(t)) continue;
    const iid = rowItemId(r);
    const posterId = resolvePosterId(r);
    const sid =
      (r.mediaType ?? '').toLowerCase() === 'episode'
        ? (iid ? seriesMap.get(iid) : seriesByTitleMap.get(r.showTitle ?? r.mediaTitle ?? ''))
        : undefined;
    if (t < minT) {
      minT = t;
      firstWatch = {
        itemId: iid,
        title: titleForRow(r),
        subtitle: subtitleForRow(r),
        startedAt: r.startedAt!,
        posterUrl: posterId ? buildItemPosterUrl(jellyfinBase, posterId, jellyfin.accessToken) : '',
        seriesId: sid,
      };
    }
    if (t > maxT) {
      maxT = t;
      lastWatch = {
        itemId: iid,
        title: titleForRow(r),
        subtitle: subtitleForRow(r),
        startedAt: r.startedAt!,
        posterUrl: posterId ? buildItemPosterUrl(jellyfinBase, posterId, jellyfin.accessToken) : '',
        seriesId: sid,
      };
    }
  }

  const avatarUrl = jellyfin.primaryImageTag
    ? `${normalizeBaseUrl(jellyfinBase)}/Users/${jellyfin.userId}/Images/Primary?tag=${encodeURIComponent(jellyfin.primaryImageTag)}&api_key=${encodeURIComponent(jellyfin.accessToken)}`
    : null;

  const episodeCount = showRows.length;

  const movieMins = movieRows.reduce((a, r) => a + (r.durationMs ?? 0) / 60000, 0);
  const showMins = showRows.reduce((a, r) => a + (r.durationMs ?? 0) / 60000, 0);

  const lateNight = (hourHeatmap[22] ?? 0) + (hourHeatmap[23] ?? 0) + (hourHeatmap[0] ?? 0) + (hourHeatmap[1] ?? 0) + (hourHeatmap[2] ?? 0);
  const totalHeatmap = hourHeatmap.reduce((a, b) => a + b, 0);
  const lateNightRatio = totalHeatmap > 0 ? lateNight / totalHeatmap : 0;
  const weekendSessions = (dayOfWeek[5] ?? 0) + (dayOfWeek[6] ?? 0);
  const weekdaySessions = dayOfWeek.slice(0, 5).reduce((a, b) => a + b, 0);
  const topGenreCount = topGenres[0]?.count ?? 0;
  const totalGenreCount = topGenres.reduce((a, g) => a + g.count, 0);
  const genreConcentration = totalGenreCount > 0 ? topGenreCount / totalGenreCount : 0;
  const total = movieMins + showMins;
  const movieRatio = total > 0 ? movieMins / total : 0;
  let personalityType: PersonalityType = 'All-Rounder';
  if (movieRatio > 0.72) personalityType = 'Movie Buff';
  else if (movieRatio < 0.28) personalityType = 'Series Addict';
  else if (lateNightRatio > 0.35) personalityType = 'Night Owl';
  else if (bingeSessions.length >= 4) personalityType = 'Binge Watcher';
  else if (weekendSessions > weekdaySessions * 0.65) personalityType = 'Weekend Warrior';
  else if (genreConcentration > 0.5) personalityType = 'Genre Fanatic';

  return {
    user: jellyfin.userName,
    avatarUrl,
    year,
    totalMinutes,
    totalSessions,
    episodeCount,
    topMovies,
    topShows,
    topGenres,
    hourHeatmap,
    dayOfWeek,
    deviceBreakdown,
    monthlyBreakdown,
    bingeSessions,
    mostReplayedItem,
    firstWatch,
    lastWatch,
    emptyYear,
    personalityType,
  };
}

/** Invalidate discovery cache (e.g. after admin changes Tracearr URL). */
export function clearTracearrDiscoveryCache(): void {
  DISCOVERY_CACHE.clear();
}
