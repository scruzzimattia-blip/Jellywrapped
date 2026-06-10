import { StatNumber } from '@/components/StatNumber';
import type { WrappedData } from '@/api/types';

function funFacts(totalMinutes: number): string[] {
  const facts: string[] = [];
  const movies = Math.round(totalMinutes / 120);
  if (movies >= 2) facts.push(`🎞️ ≈ ${movies} feature films back to back`);
  const flights = totalMinutes / 60 / 8;
  if (flights >= 1) facts.push(`✈️ ≈ ${flights.toFixed(1)} long-haul flights`);
  const moonWalks = totalMinutes / (8 * 24 * 60);
  if (moonWalks >= 1) facts.push(`🌕 ≈ ${moonWalks.toFixed(1)} round trips to the Moon (Apollo pace)`);
  return facts.slice(0, 3);
}

export function TotalTimeSlide(props: { data: WrappedData }): React.ReactElement {
  const { data } = props;
  const hours = Math.round(data.totalMinutes / 60);
  const days = data.totalMinutes / (60 * 24);
  const facts = funFacts(data.totalMinutes);

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
      {facts.length > 0 && (
        <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-2">
          {facts.map((fact) => (
            <span
              key={fact}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-[#94a3b8]"
            >
              {fact}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
