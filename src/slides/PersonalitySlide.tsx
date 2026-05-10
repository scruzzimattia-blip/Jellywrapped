import { motion } from 'framer-motion';
import type { WrappedData, PersonalityType } from '@/api/types';

const PERSONALITY_CONFIG: Record<
  PersonalityType,
  { emoji: string; description: string; color: string; gradient: string }
> = {
  'Movie Buff': {
    emoji: '🎬',
    description: 'You gravitate toward films over series. You appreciate the art of the standalone story.',
    color: '#f59e0b',
    gradient: 'from-[#f59e0b] to-[#ef4444]',
  },
  'Series Addict': {
    emoji: '📺',
    description: 'Series are your thing. You love diving deep into long-form storytelling.',
    color: '#6366f1',
    gradient: 'from-[#6366f1] to-[#8b5cf6]',
  },
  'Night Owl': {
    emoji: '🦉',
    description: 'Late nights and dim screens — your media habits thrive after dark.',
    color: '#14b8a6',
    gradient: 'from-[#0f172a] to-[#14b8a6]',
  },
  'Binge Watcher': {
    emoji: '🍿',
    description: "When you start, you don't stop. Marathon sessions are your signature move.",
    color: '#ec4899',
    gradient: 'from-[#ec4899] to-[#f43f5e]',
  },
  'Weekend Warrior': {
    emoji: '🏆',
    description: "Your weekends belong to the screen. You save it all up for Saturday and Sunday.",
    color: '#22c55e',
    gradient: 'from-[#22c55e] to-[#14b8a6]',
  },
  'Genre Fanatic': {
    emoji: '🎯',
    description: 'You know what you like and you stick to it. One genre rules them all.',
    color: '#f97316',
    gradient: 'from-[#f97316] to-[#eab308]',
  },
  'All-Rounder': {
    emoji: '🌟',
    description: 'Movies, shows, genres — you watch it all. A true media omnivore.',
    color: '#6366f1',
    gradient: 'from-[#6366f1] to-[#14b8a6]',
  },
};

export function PersonalitySlide(props: { data: WrappedData }): React.ReactElement {
  const { data } = props;
  const type = data.personalityType;
  const config = PERSONALITY_CONFIG[type];

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${config.color}22 0%, transparent 65%)`,
        }}
      />

      <motion.p
        className="relative text-sm uppercase tracking-[0.25em] text-[#64748b]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Your {data.year} Personality
      </motion.p>

      <motion.div
        className="relative mt-6 text-7xl"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 14 }}
      >
        {config.emoji}
      </motion.div>

      <motion.h2
        className={`relative mt-6 bg-gradient-to-r ${config.gradient} bg-clip-text font-[family-name:var(--font-display)] text-5xl font-semibold text-transparent sm:text-6xl`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {type}
      </motion.h2>

      <motion.p
        className="relative mt-6 max-w-sm text-base leading-relaxed text-[#94a3b8]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {config.description}
      </motion.p>

      <motion.div
        className="relative mt-10 flex flex-wrap justify-center gap-3 text-sm"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        {data.episodeCount > 0 && (
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[#94a3b8]">
            {data.episodeCount} episodes
          </span>
        )}
        {data.topMovies.length > 0 && (
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[#94a3b8]">
            {data.topMovies.reduce((a, m) => a + m.playCount, 0)} movies watched
          </span>
        )}
        {data.topGenres[0] && (
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[#94a3b8]">
            ❤️ {data.topGenres[0].genre}
          </span>
        )}
      </motion.div>
    </div>
  );
}
