import { StatNumber } from '@/components/StatNumber';
import { formatStreakDate } from '@/lib/streak';
import type { WrappedData } from '@/api/types';

export function StreakSlide(props: { data: WrappedData }): React.ReactElement {
  const { data } = props;
  const streak = data.longestStreak;
  const yearDays = data.year % 4 === 0 ? 366 : 365;
  const pct = Math.round((data.distinctDays / yearDays) * 100);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">🔥</p>
      <h2 className="mt-8 font-[family-name:var(--font-display)] text-3xl text-[#f1f5f9]">
        Consistency check
      </h2>

      {streak && streak.days > 1 ? (
        <>
          <div className="mt-8 font-[family-name:var(--font-display)] text-7xl font-semibold text-[#f1f5f9] sm:text-8xl">
            <StatNumber value={streak.days} />
            <span className="text-3xl text-[#f59e0b]"> days</span>
          </div>
          <p className="mt-4 text-lg text-[#94a3b8]">
            Your longest streak — you watched something every single day from{' '}
            {formatStreakDate(streak.start)} to {formatStreakDate(streak.end)}.
          </p>
        </>
      ) : (
        <p className="mt-8 text-xl text-[#94a3b8]">
          No back-to-back days this year — every watch was its own occasion.
        </p>
      )}

      <div className="glass-card mt-10 max-w-lg rounded-2xl p-6">
        <p className="text-xs uppercase tracking-wider text-[#64748b]">Days with at least one play</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[#f1f5f9]">
          {data.distinctDays} <span className="text-base text-[#64748b]">of {yearDays}</span>
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#f59e0b] to-[#ef4444]"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-[#64748b]">{pct}% of {data.year}</p>
      </div>
    </div>
  );
}
