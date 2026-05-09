import { motion } from 'framer-motion';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import type { WrappedData } from '@/api/types';

export function MonthTimelineSlide(props: { data: WrappedData }): React.ReactElement {
  const { data } = props;

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto py-24">
      <h2 className="mb-10 font-[family-name:var(--font-display)] text-3xl text-[#f1f5f9]">Month by month</h2>
      <div className="grid max-w-5xl grid-cols-2 gap-4 px-4 sm:grid-cols-3 md:grid-cols-4">
        {data.monthlyBreakdown.map((m, i) => (
          <motion.div
            key={m.label}
            className="glass-card flex flex-col rounded-2xl p-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[#6366f1]">{m.label}</p>
            <div className="relative mx-auto mt-3 h-28 w-20 overflow-hidden rounded-lg">
              <ImageWithFallback
                src={m.posterUrl}
                alt=""
                title={m.topTitle}
                className="h-full w-full rounded-lg shadow-lg"
              />
            </div>
            <p className="mt-2 line-clamp-2 text-center text-xs text-[#f1f5f9]">{m.topTitle}</p>
            <p className="mt-1 text-center text-[10px] text-[#64748b]">{m.count} plays</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
