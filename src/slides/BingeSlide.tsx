import type { WrappedData } from '@/api/types';

export function BingeSlide(props: { data: WrappedData }): React.ReactElement {
  const { data } = props;
  const n = data.bingeSessions.length;
  let longest: (typeof data.bingeSessions)[0] | null = null;
  for (const b of data.bingeSessions) {
    if (!longest || b.durationMinutes > longest.durationMinutes) longest = b;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">🛋️</p>
      <h2 className="mt-8 font-[family-name:var(--font-display)] text-3xl text-[#f1f5f9]">Binge archaeology</h2>
      <p className="mt-4 text-xl text-[#94a3b8]">You had {n} binge session{n === 1 ? '' : 's'}.</p>
      <p className="mt-2 text-sm text-[#64748b]">
        Chained plays within 30 minutes, total runtime over 3 hours.
      </p>
      {longest && longest.durationMinutes > 0 ? (
        <div className="glass-card mt-10 max-w-lg rounded-2xl p-6 text-left">
          <p className="text-xs uppercase tracking-wider text-[#64748b]">Longest streak</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-xl text-[#f1f5f9]">
            {longest.titles.join(' · ')}
          </p>
          <p className="mt-2 text-[#94a3b8]">
            {longest.durationMinutes} minutes · started {new Date(longest.startedAt).toLocaleDateString()}
          </p>
          <p className="mt-4 text-sm italic text-[#64748b]">The couch remembers. You watched anyway.</p>
        </div>
      ) : (
        <p className="mt-8 text-[#64748b]">No epic marathons detected — disciplined viewer energy.</p>
      )}
    </div>
  );
}
