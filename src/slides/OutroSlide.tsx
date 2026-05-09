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

  const capture = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { backgroundColor: '#090910', scale: 2 });
    const link = document.createElement('a');
    link.download = `jellyfin-wrapped-${data.year}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-24">
      <motion.h2
        className="text-center font-[family-name:var(--font-display)] text-4xl text-[#f1f5f9]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        That&apos;s a wrap, {data.user}! 🎬
      </motion.h2>

      <div
        ref={cardRef}
        className="glass-card w-full max-w-md rounded-3xl p-8 text-center shadow-2xl"
      >
        <p className="text-sm uppercase tracking-[0.2em] text-[#64748b]">Jellyfin Wrapped</p>
        <p className="mt-4 font-[family-name:var(--font-display)] text-2xl text-[#f1f5f9]">{data.year}</p>
        <div className="mt-6 grid grid-cols-2 gap-4 text-left text-sm">
          <div>
            <p className="text-[#64748b]">Hours</p>
            <p className="text-lg font-medium text-[#f1f5f9]">{Math.round(data.totalMinutes / 60)}</p>
          </div>
          <div>
            <p className="text-[#64748b]">Sessions</p>
            <p className="text-lg font-medium text-[#f1f5f9]">{data.totalSessions}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[#64748b]">Top title</p>
            <p className="text-lg font-medium text-[#f1f5f9]">
              {data.mostReplayedItem.title !== '—'
                ? data.mostReplayedItem.title
                : data.topMovies[0]?.title ?? data.topShows[0]?.title ?? '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={onReplay}
          className="rounded-xl bg-[#6366f1] px-6 py-3 text-sm font-medium text-white"
        >
          Replay from start
        </button>
        <button
          type="button"
          onClick={() => void capture()}
          className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-[#f1f5f9]"
        >
          Save share card
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl border border-white/15 bg-transparent px-6 py-3 text-sm font-medium text-[#64748b]"
        >
          Log out
        </button>
      </div>
      <p className="max-w-sm text-center text-xs text-[#64748b]">
        Screenshot &amp; share — or use Save share card for a PNG. If your Tracearr lives on another domain, set{' '}
        <code className="text-[#94a3b8]">CORS_ORIGIN</code> on the server to allow this app&apos;s origin.
      </p>
    </div>
  );
}
