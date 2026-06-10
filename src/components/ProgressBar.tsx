import { motion } from 'framer-motion';

export function ProgressBar(props: {
  total: number;
  index: number;
  onSelect?: (index: number) => void;
}): React.ReactElement {
  const { total, index, onSelect } = props;
  const pct = total > 0 ? ((index + 1) / total) * 100 : 0;

  return (
    <div className="fixed left-0 right-0 top-0 z-[100] h-1 bg-white/5">
      <motion.div
        className="h-full bg-[#6366f1]"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      />
      <div className="absolute left-0 right-0 top-3 flex justify-center gap-1.5 px-4">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={onSelect ? () => onSelect(i) : undefined}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i === index ? 'bg-[#6366f1]' : 'bg-white/15 hover:bg-white/40'
            } ${onSelect ? 'cursor-pointer' : 'pointer-events-none'}`}
          />
        ))}
      </div>
    </div>
  );
}
