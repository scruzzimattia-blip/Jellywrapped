import { BarChart } from '@/components/BarChart';
import type { WrappedData } from '@/api/types';

function hourLabel(peak: number): { emoji: string; text: string } {
  if (peak >= 0 && peak < 5) return { emoji: '🦉', text: "You're a night owl" };
  if (peak < 11) return { emoji: '🐦', text: "You're an early bird" };
  if (peak < 17) return { emoji: '🍿', text: "You're an afternoon binger" };
  return { emoji: '🌆', text: 'Prime-time regular' };
}

export function HourHeatmapSlide(props: { data: WrappedData }): React.ReactElement {
  const { data } = props;
  const chartData = data.hourHeatmap.map((value, hour) => ({
    label: `${hour}`,
    value,
  }));
  const peak = data.hourHeatmap.indexOf(Math.max(...data.hourHeatmap));
  const { emoji, text } = hourLabel(peak === -1 ? 12 : peak);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-display)] text-3xl text-[#f1f5f9]">Hours of the day</h2>
        <p className="mt-2 text-[#f59e0b]">
          {text} {emoji} — peak around {peak}:00.
        </p>
      </div>
      <BarChart data={chartData} color="#6366f1" />
    </div>
  );
}
