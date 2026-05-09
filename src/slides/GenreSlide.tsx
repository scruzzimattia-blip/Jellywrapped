import { motion } from 'framer-motion';
import type { WrappedData } from '@/api/types';

export function GenreSlide(props: { data: WrappedData }): React.ReactElement {
  const { data } = props;
  const top = data.topGenres[0]?.genre ?? 'Everything';

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 30% 20%, rgba(99,102,241,0.4), transparent 55%),
            radial-gradient(circle at 70% 80%, rgba(245,158,11,0.25), transparent 50%)`,
        }}
      />
      <motion.p
        className="relative text-sm uppercase tracking-[0.25em] text-[#64748b]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Your vibe
      </motion.p>
      <motion.h2
        className="relative mt-6 max-w-4xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-[#f1f5f9] sm:text-5xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        You really love{' '}
        <span className="bg-gradient-to-r from-[#6366f1] to-[#f59e0b] bg-clip-text text-transparent">{top}</span>
      </motion.h2>
      {data.topGenres.length > 1 ? (
        <p className="relative mt-6 text-[#64748b]">
          Runner-up: {data.topGenres.slice(1, 4).map((g) => `${g.genre} (${g.count})`).join(' · ')}
        </p>
      ) : null}
    </div>
  );
}
