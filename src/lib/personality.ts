import type { BingeSession, GenreItem, PersonalityType } from '@/api/types';

export function computePersonalityType(opts: {
  movieMinutes: number;
  showMinutes: number;
  hourHeatmap: number[];
  dayOfWeek: number[];
  topGenres: GenreItem[];
  bingeSessions: BingeSession[];
}): PersonalityType {
  const { movieMinutes, showMinutes, hourHeatmap, dayOfWeek, topGenres, bingeSessions } = opts;
  const total = movieMinutes + showMinutes;
  const movieRatio = total > 0 ? movieMinutes / total : 0;

  const lateNight =
    (hourHeatmap[22] ?? 0) +
    (hourHeatmap[23] ?? 0) +
    (hourHeatmap[0] ?? 0) +
    (hourHeatmap[1] ?? 0) +
    (hourHeatmap[2] ?? 0);
  const totalSessions = hourHeatmap.reduce((a, b) => a + b, 0);
  const lateNightRatio = totalSessions > 0 ? lateNight / totalSessions : 0;

  const weekendSessions = (dayOfWeek[5] ?? 0) + (dayOfWeek[6] ?? 0);
  const weekdaySessions =
    (dayOfWeek[0] ?? 0) +
    (dayOfWeek[1] ?? 0) +
    (dayOfWeek[2] ?? 0) +
    (dayOfWeek[3] ?? 0) +
    (dayOfWeek[4] ?? 0);

  const topGenreCount = topGenres[0]?.count ?? 0;
  const totalGenreCount = topGenres.reduce((a, g) => a + g.count, 0);
  const genreConcentration = totalGenreCount > 0 ? topGenreCount / totalGenreCount : 0;

  if (movieRatio > 0.72) return 'Movie Buff';
  if (movieRatio < 0.28) return 'Series Addict';
  if (lateNightRatio > 0.35) return 'Night Owl';
  if (bingeSessions.length >= 4) return 'Binge Watcher';
  if (weekendSessions > weekdaySessions * 0.65) return 'Weekend Warrior';
  if (genreConcentration > 0.5) return 'Genre Fanatic';
  return 'All-Rounder';
}
