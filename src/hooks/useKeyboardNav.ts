import { useEffect } from 'react';

export function useKeyboardNav(opts: {
  onPrev: () => void;
  onNext: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}): void {
  const { onPrev, onNext, onEscape, enabled = true } = opts;

  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPrev, onNext, onEscape, enabled]);
}
