import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import type { WrappedData } from '@/api/types';

export function OutroSlide(props: {
  data: WrappedData;
  onReplay: () => void;
  onLogout: () => void;
}): React.ReactElement {
  const { data, onReplay, onLogout } = props;
  const cardRef = useRef<HTMLDivElement>(null);

  const renderCard = async () => {
    if (!cardRef.current) return null;
    return html2canvas(cardRef.current, { backgroundColor: '#090910', scale: 2 });
  };

  const download = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a');
    link.download = `jellyfin-wrapped-${data.year}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const capture = async () => {
    const canvas = await renderCard();
    if (canvas) download(canvas);
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const share = async () => {
    const canvas = await renderCard();
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (blob) {
      const file = new File([blob], `jellyfin-wrapped-${data.year}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `Jellyfin Wrapped ${data.year}` });
          return;
        } catch {
          // user cancelled or share failed — fall back to download
        }
      }
    }
    download(canvas);
  };

  const topTitle =
    data.mostReplayedItem.title !== '—'
      ? data.mostReplayedItem.title
      : data.topMovies[0]?.title ?? data.topShows[0]?.title ?? '—';

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-20">
      <motion.h2
        className="text-center font-[family-name:var(--font-display)] text-4xl text-[#f1f5f9]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        That&apos;s a wrap, {data.user}! 🎬
      </motion.h2>

      <motion.div
        ref={cardRef}
        className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] p-8 text-center shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="mb-2 flex justify-center">
          <span className="rounded-full bg-gradient-to-r from-[#6366f1] to-[#14b8a6] px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-white">
            Jellyfin Wrapped {data.year}
          </span>
        </div>
        <p className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f1f5f9]">
          {data.user}
        </p>
        <p className="mt-1 text-sm text-[#64748b]">{data.personalityType}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs text-[#64748b]">Hours watched</p>
            <p className="mt-0.5 text-xl font-semibold text-[#f1f5f9]">
              {Math.round(data.totalMinutes / 60)}h
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs text-[#64748b]">Episodes</p>
            <p className="mt-0.5 text-xl font-semibold text-[#f1f5f9]">{data.episodeCount}</p>
          </div>
          {data.longestStreak && data.longestStreak.days > 1 && (
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-[#64748b]">Longest streak</p>
              <p className="mt-0.5 text-xl font-semibold text-[#f1f5f9]">
                {data.longestStreak.days} days
              </p>
            </div>
          )}
          {data.distinctDays > 0 && (
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-[#64748b]">Watch days</p>
              <p className="mt-0.5 text-xl font-semibold text-[#f1f5f9]">{data.distinctDays}</p>
            </div>
          )}
          <div className="col-span-2 rounded-xl bg-white/5 p-3">
            <p className="text-xs text-[#64748b]">Top title</p>
            <p className="mt-0.5 truncate text-base font-medium text-[#f1f5f9]">{topTitle}</p>
          </div>
          {data.topGenres[0] && (
            <div className="col-span-2 rounded-xl bg-white/5 p-3">
              <p className="text-xs text-[#64748b]">Favorite genre</p>
              <p className="mt-0.5 text-base font-medium text-[#f1f5f9]">{data.topGenres[0].genre}</p>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        className="flex flex-wrap justify-center gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          type="button"
          onClick={onReplay}
          className="rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6366f1]/20 transition hover:opacity-90"
        >
          Replay from start
        </button>
        {canShare && (
          <button
            type="button"
            onClick={() => void share()}
            className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-[#f1f5f9] transition hover:bg-white/10"
          >
            Share
          </button>
        )}
        <button
          type="button"
          onClick={() => void capture()}
          className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-[#f1f5f9] transition hover:bg-white/10"
        >
          Save share card
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl border border-white/10 bg-transparent px-6 py-3 text-sm font-medium text-[#64748b] transition hover:text-[#94a3b8]"
        >
          Log out
        </button>
      </motion.div>
    </div>
  );
}
