import { DonutChart } from '@/components/DonutChart';
import type { WrappedData } from '@/api/types';

export function DevicesSlide(props: { data: WrappedData }): React.ReactElement {
  const { data } = props;
  const chart = data.deviceBreakdown.map((d) => ({ name: d.name, value: d.count }));
  const top = data.deviceBreakdown[0]?.name ?? 'Unknown';

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-display)] text-3xl text-[#f1f5f9]">Your devices</h2>
        <p className="mt-3 text-lg text-[#94a3b8]">Your go-to: {top}</p>
      </div>
      {chart.length === 0 ? (
        <p className="text-[#64748b]">No device labels in history.</p>
      ) : (
        <DonutChart data={chart} />
      )}
    </div>
  );
}
