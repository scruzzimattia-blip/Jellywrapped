import type { JellyfinWatchedItem } from '@/api/jellyfin';
import { buildPosterUrl, buildBackdropUrl } from '@/api/jellyfin';
import type {
  WrappedData,
  MediaItem,
  GenreItem,
  MonthItem,
  HistoryItem,
  BingeSession,
} from '@/api/types';
import { computePersonalityType } from '@/lib/personality';

function ticksToMinutes(ticks: number): number {
  return ticks / 600_000_000;
}

function parseDate(iso: string | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function processJellyfinHistory(
  items: JellyfinWatchedItem[],
  opts: {
    serverUrl: string;
    userId: string;
    accessToken: string;
    userName: string;
    avatarUrl: string | null;
    year: number;
  }
): WrappedData {
  const { serverUrl, accessToken, userName, avatarUrl, year } = opts;

  const emptyYear = items.length === 0;

  if (emptyYear) {
    const empty: WrappedData = {
      user: userName,
      avatarUrl,
      year,
      totalMinutes: 0,
      totalSessions: 0,
      episodeCount: 0,
      topMovies: [],
      topShows: [],
      topGenres: [],
      hourHeatmap: Array(24).fill(0) as number[],
      dayOfWeek: Array(7).fill(0) as number[],
      deviceBreakdown: [],
      monthlyBreakdown: MONTH_LABELS.map((label, month) => ({
        month, label, topTitle: '—', count: 0, posterUrl: '', itemId: '',
      })),
      bingeSessions: [],
      mostReplayedItem: { itemId: '', title: '—', playCount: 0, totalMinutes: 0, posterUrl: '' },
      firstWatch: { itemId: '', title: '—', startedAt: new Date(0).toISOString(), posterUrl: '' },
      lastWatch: { itemId: '', title: '—', startedAt: new Date(0).toISOString(), posterUrl: '' },
      emptyYear: true,
      personalityType: 'All-Rounder',
    };
    return empty;
  }

  // --- Totals ---
  let totalMinutes = 0;
  let movieMinutes = 0;
  let showMinutes = 0;
  let episodeCount = 0;

  for (const item of items) {
    const mins = item.runTimeTicks ? ticksToMinutes(item.runTimeTicks) * item.playCount : 0;
    totalMinutes += mins;
    if (item.type === 'Movie') movieMinutes += mins;
    else { showMinutes += mins; episodeCount += 1; }
  }

  // --- Top Movies ---
  const movieMap = new Map<string, { item: JellyfinWatchedItem; count: number; minutes: number }>();
  for (const item of items) {
    if (item.type !== 'Movie') continue;
    const key = item.id;
    const cur = movieMap.get(key);
    const mins = item.runTimeTicks ? ticksToMinutes(item.runTimeTicks) * item.playCount : 0;
    if (cur) { cur.count += item.playCount; cur.minutes += mins; }
    else movieMap.set(key, { item, count: item.playCount, minutes: mins });
  }

  const topMovies: MediaItem[] = [...movieMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ item, count, minutes }) => ({
      itemId: item.id,
      title: item.name,
      playCount: count,
      totalMinutes: Math.round(minutes),
      posterUrl: buildPosterUrl(serverUrl, item.id, accessToken),
      backdropUrl: buildBackdropUrl(serverUrl, item.id, accessToken),
    }));

  // --- Top Shows ---
  const showMap = new Map<string, { seriesId: string; title: string; episodes: Set<string>; minutes: number; item: JellyfinWatchedItem }>();
  for (const item of items) {
    if (item.type !== 'Episode') continue;
    const key = item.seriesId ?? item.seriesName ?? item.name;
    const mins = item.runTimeTicks ? ticksToMinutes(item.runTimeTicks) : 0;
    const cur = showMap.get(key);
    if (cur) { cur.episodes.add(item.id); cur.minutes += mins; }
    else showMap.set(key, {
      seriesId: item.seriesId ?? item.id,
      title: item.seriesName ?? item.name,
      episodes: new Set([item.id]),
      minutes: mins,
      item,
    });
  }

  const topShows: MediaItem[] = [...showMap.values()]
    .sort((a, b) => b.episodes.size - a.episodes.size || b.minutes - a.minutes)
    .slice(0, 5)
    .map(({ seriesId, title, episodes, minutes }) => ({
      itemId: seriesId,
      seriesId,
      title,
      playCount: episodes.size,
      episodeCount: episodes.size,
      totalMinutes: Math.round(minutes),
      posterUrl: buildPosterUrl(serverUrl, seriesId, accessToken),
      backdropUrl: buildBackdropUrl(serverUrl, seriesId, accessToken),
    }));

  // --- Genres ---
  const genreMap = new Map<string, number>();
  for (const item of items) {
    for (const g of item.genres) {
      const k = g.trim();
      if (!k) continue;
      genreMap.set(k, (genreMap.get(k) ?? 0) + item.playCount);
    }
  }
  const topGenres: GenreItem[] = [...genreMap.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // --- Hour heatmap & day of week ---
  const hourHeatmap = Array(24).fill(0) as number[];
  const dayOfWeek = Array(7).fill(0) as number[];

  for (const item of items) {
    const d = parseDate(item.lastPlayedDate);
    if (!d) continue;
    hourHeatmap[d.getHours()] += item.playCount;
    dayOfWeek[(d.getDay() + 6) % 7] += item.playCount;
  }

  // --- Monthly breakdown ---
  const monthMap: Map<number, Map<string, { count: number; item: JellyfinWatchedItem }>> = new Map();
  for (const item of items) {
    const d = parseDate(item.lastPlayedDate);
    if (!d) continue;
    const m = d.getMonth();
    const title = item.type === 'Episode' ? (item.seriesName ?? item.name) : item.name;
    if (!monthMap.has(m)) monthMap.set(m, new Map());
    const map = monthMap.get(m)!;
    const cur = map.get(title);
    if (cur) cur.count += item.playCount;
    else map.set(title, { count: item.playCount, item });
  }

  const monthlyBreakdown: MonthItem[] = MONTH_LABELS.map((label, i) => {
    const map = monthMap.get(i);
    if (!map || map.size === 0) return { month: i, label, topTitle: '—', count: 0, posterUrl: '', itemId: '' };
    let best = { title: '', count: -1, item: null as JellyfinWatchedItem | null };
    for (const [title, v] of map.entries()) {
      if (v.count > best.count) best = { title, count: v.count, item: v.item };
    }
    const item = best.item!;
    const posterId = item.type === 'Episode' ? (item.seriesId ?? item.id) : item.id;
    return {
      month: i,
      label,
      topTitle: best.title,
      count: best.count,
      posterUrl: buildPosterUrl(serverUrl, posterId, accessToken),
      itemId: item.id,
      seriesId: item.seriesId,
    };
  });

  // --- Binge sessions (group by day, flag multi-episode streaks) ---
  const dayBuckets = new Map<string, JellyfinWatchedItem[]>();
  for (const item of items) {
    const d = parseDate(item.lastPlayedDate);
    if (!d) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const bucket = dayBuckets.get(key) ?? [];
    bucket.push(item);
    dayBuckets.set(key, bucket);
  }

  const bingeSessions: BingeSession[] = [];
  for (const [, bucket] of dayBuckets.entries()) {
    const totalMins = bucket.reduce((a, it) => a + (it.runTimeTicks ? ticksToMinutes(it.runTimeTicks) : 0), 0);
    if (totalMins >= 180) {
      const d = parseDate(bucket[0].lastPlayedDate)!;
      const titles = [...new Set(bucket.map((it) => it.type === 'Episode' ? (it.seriesName ?? it.name) : it.name))];
      bingeSessions.push({
        startedAt: d.toISOString(),
        endedAt: d.toISOString(),
        durationMinutes: Math.round(totalMins),
        titles,
      });
    }
  }
  bingeSessions.sort((a, b) => b.durationMinutes - a.durationMinutes);

  // --- Most replayed ---
  let mostReplayedItem: MediaItem = { itemId: '', title: '—', playCount: 0, totalMinutes: 0, posterUrl: '' };
  for (const item of items) {
    if (item.playCount > mostReplayedItem.playCount) {
      const posterId = item.type === 'Episode' ? (item.seriesId ?? item.id) : item.id;
      mostReplayedItem = {
        itemId: item.id,
        seriesId: item.seriesId,
        title: item.type === 'Episode' ? (item.seriesName ?? item.name) : item.name,
        playCount: item.playCount,
        totalMinutes: item.runTimeTicks ? Math.round(ticksToMinutes(item.runTimeTicks) * item.playCount) : 0,
        posterUrl: buildPosterUrl(serverUrl, posterId, accessToken),
        backdropUrl: buildBackdropUrl(serverUrl, posterId, accessToken),
      };
    }
  }

  // --- First & last watch ---
  let firstWatch: HistoryItem = { itemId: '', title: '—', startedAt: new Date(0).toISOString(), posterUrl: '' };
  let lastWatch: HistoryItem = { itemId: '', title: '—', startedAt: new Date(0).toISOString(), posterUrl: '' };
  let minT = Infinity;
  let maxT = -Infinity;

  for (const item of items) {
    const d = parseDate(item.lastPlayedDate);
    if (!d) continue;
    const t = d.getTime();
    const posterId = item.type === 'Episode' ? (item.seriesId ?? item.id) : item.id;
    const title = item.type === 'Episode' ? (item.seriesName ?? item.name) : item.name;
    if (t < minT) {
      minT = t;
      firstWatch = { itemId: item.id, title, startedAt: d.toISOString(), posterUrl: buildPosterUrl(serverUrl, posterId, accessToken), seriesId: item.seriesId };
    }
    if (t > maxT) {
      maxT = t;
      lastWatch = { itemId: item.id, title, startedAt: d.toISOString(), posterUrl: buildPosterUrl(serverUrl, posterId, accessToken), seriesId: item.seriesId };
    }
  }

  // --- Personality type ---
  const personalityType = computePersonalityType({
    movieMinutes,
    showMinutes,
    hourHeatmap,
    dayOfWeek,
    topGenres,
    bingeSessions,
  });

  return {
    user: userName,
    avatarUrl,
    year,
    totalMinutes: Math.round(totalMinutes),
    totalSessions: items.length,
    episodeCount,
    topMovies,
    topShows,
    topGenres,
    hourHeatmap,
    dayOfWeek,
    deviceBreakdown: [],
    monthlyBreakdown,
    bingeSessions,
    mostReplayedItem,
    firstWatch,
    lastWatch,
    emptyYear: false,
    personalityType,
  };
}
