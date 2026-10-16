/** One dot per seat: done ones green, the current one yellow and bigger (reveal / vote progress). */
import '../../styles/game.css';

export interface ProgressDotsProps {
  total: number;
  /** 0-based index of the current seat. */
  current: number;
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <span className="pdots" aria-hidden="true">
      {Array.from({ length: Math.max(0, total) }, (_, i) => (
        <i key={i} className={i < current ? 'is-done' : i === current ? 'is-current' : ''} />
      ))}
    </span>
  );
}
