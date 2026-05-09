import { StatNumber } from '@/components/StatNumber';
import type { WrappedData } from '@/api/types';

export function TotalSessionsSlide(props: { data: WrappedData }): React.ReactElement {
  const { data } = props;
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-[#64748b]">Sessions</p>
      <div className="mt-6 font-[family-name:var(--font-display)] text-7xl font-semibold text-[#f1f5f9] sm:text-8xl">
        <StatNumber value={data.totalSessions} durationMs={1800} />
      </div>
      <p className="mt-8 text-xl text-[#94a3b8]">You hit play {data.totalSessions.toLocaleString()} times this year.</p>
    </div>
  );
}
