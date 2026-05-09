import { StatNumber } from '@/components/StatNumber';
import type { WrappedData } from '@/api/types';

export function TotalTimeSlide(props: { data: WrappedData }): React.ReactElement {
  const { data } = props;
  const hours = Math.round(data.totalMinutes / 60);
  const days = data.totalMinutes / (60 * 24);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-[#64748b]">Total watch time</p>
      <div className="mt-6 font-[family-name:var(--font-display)] text-7xl font-semibold text-[#f1f5f9] sm:text-8xl">
        <StatNumber value={hours} />
        <span className="text-4xl text-[#6366f1]">h</span>
      </div>
      <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#94a3b8]">
        That&apos;s {days.toFixed(1)} full days of your life.
      </p>
    </div>
  );
}
