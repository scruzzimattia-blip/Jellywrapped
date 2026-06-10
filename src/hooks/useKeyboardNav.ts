import { useEffect } from 'react';

export function useKeyboardNav(opts: {
  onPrev: () => void;
  onNext: () => void;
  onEscape?: () => void;
  onTogglePlay?: () => void;
  enabled?: boolean;
}): void {
  const { onPrev, onNext, onEscape, onTogglePlay, enabled = true } = opts;

  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.key === ' ' && onTogglePlay) {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPrev, onNext, onEscape, onTogglePlay, enabled]);
}
