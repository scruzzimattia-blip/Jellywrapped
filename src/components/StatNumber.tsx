import { useCountUp } from '@/hooks/useCountUp';

export function StatNumber(props: {
  value: number;
  durationMs?: number;
  className?: string;
  enabled?: boolean;
}): React.ReactElement {
  const { value, durationMs = 2200, className = '', enabled = true } = props;
  const n = useCountUp(value, durationMs, enabled);
  return (
    <span className={`font-[family-name:var(--font-display)] tabular-nums ${className}`}>{n}</span>
  );
}
