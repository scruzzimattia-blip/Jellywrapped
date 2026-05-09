import { motion } from 'framer-motion';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import type { WrappedData } from '@/api/types';

export function MostWatchedSlide(props: { data: WrappedData }): React.ReactElement {
  const { data } = props;
  const item = data.mostReplayedItem;

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
      {item.backdropUrl ? (
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center blur-3xl"
          style={{ backgroundImage: `url(${item.backdropUrl})`, opacity: 0.4 }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#6366f1]/25 to-[#090910]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090910] via-[#090910]/85 to-transparent" />

      <motion.div
        className="relative z-10 flex flex-col items-center px-6 text-center"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.65 }}
      >
        <p className="text-sm uppercase tracking-[0.3em] text-[#f59e0b]">Most watched</p>
        <div className="mt-8 h-64 w-44 overflow-hidden rounded-xl shadow-2xl">
          <ImageWithFallback
            src={item.posterUrl}
            alt=""
            title={item.title}
            className="poster-tilt h-full w-full rounded-xl"
          />
        </div>
        <h2 className="mt-8 max-w-xl font-[family-name:var(--font-display)] text-3xl text-[#f1f5f9]">
          {item.title}
        </h2>
        {item.seriesTitle && item.seriesTitle !== item.title ? (
          <p className="mt-2 text-[#94a3b8]">{item.seriesTitle}</p>
        ) : null}
        <p className="mt-6 text-lg text-[#6366f1]">{item.playCount} plays this year</p>
      </motion.div>
    </div>
  );
}
