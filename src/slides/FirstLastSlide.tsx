import { motion } from 'framer-motion';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import type { HistoryItem, WrappedData } from '@/api/types';

function Card(props: { label: string; item: HistoryItem }): React.ReactElement {
  const { label, item } = props;
  return (
    <motion.div
      className="glass-card flex flex-1 flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="h-36 w-24 shrink-0 overflow-hidden rounded-lg shadow-lg">
        <ImageWithFallback
          src={item.posterUrl}
          alt=""
          title={item.title}
          className="h-full w-full rounded-lg"
        />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-[#f59e0b]">{label}</p>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl text-[#f1f5f9]">{item.title}</h3>
        {item.subtitle ? <p className="text-sm text-[#64748b]">{item.subtitle}</p> : null}
        <p className="mt-3 text-sm text-[#94a3b8]">{new Date(item.startedAt).toLocaleString()}</p>
      </div>
    </motion.div>
  );
}

export function FirstLastSlide(props: { data: WrappedData }): React.ReactElement {
  const { data } = props;

  return (
    <div className="flex flex-1 flex-col justify-center gap-8 px-4 py-24">
      <h2 className="text-center font-[family-name:var(--font-display)] text-3xl text-[#f1f5f9]">
        How the year bookmarked itself
      </h2>
      <div className="mx-auto flex max-w-4xl flex-col gap-6 md:flex-row">
        <Card label="Started the year with" item={data.firstWatch} />
        <Card label="Ended with" item={data.lastWatch} />
      </div>
    </div>
  );
}
