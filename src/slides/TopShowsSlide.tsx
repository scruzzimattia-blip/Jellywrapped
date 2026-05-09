import { PosterGrid } from '@/components/PosterGrid';
import type { WrappedData } from '@/api/types';

export function TopShowsSlide(props: { data: WrappedData }): React.ReactElement {
  const { data } = props;
  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto py-24">
      <h2 className="mb-10 font-[family-name:var(--font-display)] text-3xl text-[#f1f5f9]">Top series</h2>
      {data.topShows.length === 0 ? (
        <p className="text-[#64748b]">No episodic adventures logged — cinema purist?</p>
      ) : (
        <PosterGrid items={data.topShows} mode="show" />
      )}
    </div>
  );
}
