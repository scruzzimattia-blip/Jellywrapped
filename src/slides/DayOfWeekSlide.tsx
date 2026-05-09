import { BarChart } from '@/components/BarChart';
import type { WrappedData } from '@/api/types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function DayOfWeekSlide(props: { data: WrappedData }): React.ReactElement {
  const { data } = props;
  const chartData = data.dayOfWeek.map((value, i) => ({
    label: DAYS[i] ?? String(i),
    value,
  }));
  const maxIdx = data.dayOfWeek.indexOf(Math.max(...data.dayOfWeek));
  const couch = DAYS[maxIdx] ?? '—';

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-display)] text-3xl text-[#f1f5f9]">Days of the week</h2>
        <p className="mt-3 text-lg text-[#94a3b8]">Your couch day: {couch}</p>
      </div>
      <BarChart data={chartData} color="#f59e0b" />
    </div>
  );
}
