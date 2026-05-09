import { motion } from 'framer-motion';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import type { MediaItem } from '@/api/types';

function Poster(props: {
  item: MediaItem;
  rank: number;
  subtitle?: string;
}): React.ReactElement {
  const { item, rank, subtitle } = props;

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08, duration: 0.45 }}
    >
      <div className="relative">
        <span className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#f59e0b] text-sm font-bold text-[#090910]">
          {rank}
        </span>
        <ImageWithFallback
          src={item.posterUrl}
          alt=""
          title={item.title}
          className="poster-tilt h-40 w-[106px] rounded-lg shadow-xl"
        />
      </div>
      <div className="max-w-[120px] text-center">
        <p className="text-sm font-medium leading-snug text-[#f1f5f9]">{item.title}</p>
        {subtitle != null ? (
          <p className="mt-0.5 text-xs text-[#64748b]">{subtitle}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

export function PosterGrid(props: {
  items: MediaItem[];
  mode: 'movie' | 'show';
}): React.ReactElement {
  const { items, mode } = props;

  return (
    <div className="flex flex-wrap justify-center gap-6 px-4">
      {items.map((item, i) => (
        <Poster
          key={item.itemId + i}
          item={item}
          rank={i + 1}
          subtitle={
            mode === 'movie'
              ? `${item.playCount} plays`
              : `${item.episodeCount ?? 0} episodes watched`
          }
        />
      ))}
    </div>
  );
}
