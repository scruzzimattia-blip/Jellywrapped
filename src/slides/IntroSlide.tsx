import { motion } from 'framer-motion';
import { ImageWithFallback } from '@/components/ImageWithFallback';

export function IntroSlide(props: {
  userName: string;
  year: number;
  avatarUrl: string | null;
  loading: boolean;
  error: string | null;
  dataReady: boolean;
  onRetry: () => void;
}): React.ReactElement {
  const { userName, year, avatarUrl, loading, error, dataReady, onRetry } = props;

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            'radial-gradient(circle at 20% 30%, rgba(99,102,241,0.35), transparent 45%), radial-gradient(circle at 80% 70%, rgba(245,158,11,0.2), transparent 40%)',
        }}
      />
      <motion.div
        className="relative mb-8 opacity-90"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img src="/jellyfish.svg" alt="" className="mx-auto h-20 w-20" />
      </motion.div>

      <div className="relative mb-6 h-20 w-20 overflow-hidden rounded-full border border-white/10 shadow-xl">
        <ImageWithFallback
          src={avatarUrl ?? ''}
          alt=""
          title={userName}
          className="h-full w-full rounded-full"
        />
      </div>

      <motion.h1
        className="relative font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[#f1f5f9] sm:text-5xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Your {year} in media, {userName}.
      </motion.h1>

      {loading ? (
        <div className="relative mt-12 flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#6366f1] border-t-transparent" />
          <p className="text-sm text-[#64748b]">Summoning your stats from Tracearr…</p>
        </div>
      ) : null}

      {error ? (
        <div className="glass-card relative mt-10 max-w-md rounded-2xl p-6 text-left">
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-xl bg-[#6366f1] px-4 py-2 text-sm font-medium text-white"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && dataReady ? (
        <motion.p
          className="relative mt-10 text-sm text-[#64748b]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Press → to begin
        </motion.p>
      ) : null}
    </div>
  );
}
