import { AnimatePresence } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import type { TracearrAdminConfig } from '@/adminStorage';
import type { JellyfinSession } from '@/api/jellyfinApi';
import { clearJellyfinSession } from '@/api/jellyfinApi';
import { SlideMotion } from '@/components/SlideContainer';
import { ProgressBar } from '@/components/ProgressBar';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';
import { useWrappedData } from '@/hooks/useWrappedData';
import { IntroSlide } from '@/slides/IntroSlide';
import { EmptyYearSlide } from '@/slides/EmptyYearSlide';
import { TotalTimeSlide } from '@/slides/TotalTimeSlide';
import { TotalSessionsSlide } from '@/slides/TotalSessionsSlide';
import { TopMoviesSlide } from '@/slides/TopMoviesSlide';
import { TopShowsSlide } from '@/slides/TopShowsSlide';
import { GenreSlide } from '@/slides/GenreSlide';
import { HourHeatmapSlide } from '@/slides/HourHeatmapSlide';
import { DayOfWeekSlide } from '@/slides/DayOfWeekSlide';
import { BingeSlide } from '@/slides/BingeSlide';
import { DevicesSlide } from '@/slides/DevicesSlide';
import { MostWatchedSlide } from '@/slides/MostWatchedSlide';
import { MonthTimelineSlide } from '@/slides/MonthTimelineSlide';
import { FirstLastSlide } from '@/slides/FirstLastSlide';
import { OutroSlide } from '@/slides/OutroSlide';

const FULL_SLIDES = [
  'intro',
  'total',
  'sessions',
  'movies',
  'shows',
  'genre',
  'hour',
  'day',
  'binge',
  'devices',
  'most',
  'months',
  'firstlast',
  'outro',
] as const;

const EMPTY_SLIDES = ['intro', 'empty', 'outro'] as const;

export function WrappedExperience(props: {
  admin: TracearrAdminConfig;
  session: JellyfinSession;
  onLoggedOut: () => void;
}): React.ReactElement {
  const { admin, session, onLoggedOut } = props;
  const [slideIndex, setSlideIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const { data, loading, error, retry } = useWrappedData(admin, session, true);

  const slides = useMemo(() => {
    if (!data) return ['intro'] as string[];
    return data.emptyYear ? [...EMPTY_SLIDES] : [...FULL_SLIDES];
  }, [data]);

  const currentId = slides[slideIndex] ?? 'intro';

  const goNext = useCallback(() => {
    if (currentId === 'intro' && (loading || !data)) return;
    setDirection(1);
    setSlideIndex((i) => Math.min(i + 1, slides.length - 1));
  }, [currentId, loading, data, slides.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setSlideIndex((i) => Math.max(i - 1, 0));
  }, []);

  const logout = useCallback(() => {
    clearJellyfinSession();
    onLoggedOut();
  }, [onLoggedOut]);

  const onReplay = useCallback(() => {
    setSlideIndex(0);
    setDirection(0);
  }, []);

  useKeyboardNav({
    onPrev: goPrev,
    onNext: goNext,
    enabled: true,
  });

  const swipe = useSwipeable({
    onSwipedLeft: goNext,
    onSwipedRight: goPrev,
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  return (
    <div
      className="relative h-full min-h-[100dvh] overflow-hidden bg-[#090910] text-[#f1f5f9]"
      {...swipe}
    >
      <div className="noise-overlay" />
      <ProgressBar total={slides.length} index={slideIndex} />

      <button
        type="button"
        onClick={logout}
        className="fixed right-4 top-10 z-[110] text-xs text-[#64748b] underline-offset-4 hover:text-[#94a3b8] hover:underline"
      >
        Log out
      </button>

      <div className="relative h-full pt-14">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <SlideMotion slideKey={`${currentId}-${slideIndex}`} direction={direction}>
            {currentId === 'intro' ? (
              <IntroSlide
                userName={session.userName}
                year={admin.year}
                avatarUrl={data?.avatarUrl ?? null}
                loading={loading}
                error={error}
                dataReady={!!data}
                onRetry={retry}
              />
            ) : null}
            {currentId === 'empty' && data ? <EmptyYearSlide year={data.year} /> : null}
            {currentId === 'total' && data ? <TotalTimeSlide data={data} /> : null}
            {currentId === 'sessions' && data ? <TotalSessionsSlide data={data} /> : null}
            {currentId === 'movies' && data ? <TopMoviesSlide data={data} /> : null}
            {currentId === 'shows' && data ? <TopShowsSlide data={data} /> : null}
            {currentId === 'genre' && data ? <GenreSlide data={data} /> : null}
            {currentId === 'hour' && data ? <HourHeatmapSlide data={data} /> : null}
            {currentId === 'day' && data ? <DayOfWeekSlide data={data} /> : null}
            {currentId === 'binge' && data ? <BingeSlide data={data} /> : null}
            {currentId === 'devices' && data ? <DevicesSlide data={data} /> : null}
            {currentId === 'most' && data ? <MostWatchedSlide data={data} /> : null}
            {currentId === 'months' && data ? <MonthTimelineSlide data={data} /> : null}
            {currentId === 'firstlast' && data ? <FirstLastSlide data={data} /> : null}
            {currentId === 'outro' && data ? (
              <OutroSlide data={data} onReplay={onReplay} onLogout={logout} />
            ) : null}
          </SlideMotion>
        </AnimatePresence>
      </div>

      <div className="pointer-events-none fixed bottom-6 left-0 right-0 flex justify-center gap-6 text-xs text-[#64748b]">
        <span>← → navigate</span>
      </div>
    </div>
  );
}
