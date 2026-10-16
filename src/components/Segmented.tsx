import type { CSSProperties } from 'react';
import { playSfx } from '../lib/sfx';
import './Segmented.css';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string | number> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  'aria-label'?: string;
  /** When set, every option gets data-testid="{testId}-{value}" (stable selectors for e2e tests). */
  testId?: string;
  /** Extra class on the group (e.g. `segmented--switch` for an On/Off pair). */
  className?: string;
}

/**
 * Single-choice option row (radio semantics) drawn as a pill group with one sliding active pill.
 * The pill is a CSS pseudo-element positioned from `--seg-n` (option count) and `--seg-i` (active
 * index), so it glides between options and mirrors in RTL with no JavaScript measuring.
 */
export function Segmented<T extends string | number>({ value, options, onChange, testId, className = '', ...rest }: SegmentedProps<T>) {
  const index = options.findIndex((o) => o.value === value);
  const style = { '--seg-n': options.length, '--seg-i': Math.max(index, 0) } as CSSProperties;
  return (
    <div
      className={`segmented ${className}`.trim()}
      role="radiogroup"
      aria-label={rest['aria-label']}
      style={style}
      data-value={String(value)}
      data-has-active={index >= 0 ? 'true' : 'false'}
    >
      {options.map((o) => (
        <button
          type="button"
          key={String(o.value)}
          role="radio"
          aria-checked={o.value === value}
          data-testid={testId ? `${testId}-${String(o.value)}` : undefined}
          className={`segmented__opt ${o.value === value ? 'is-active' : ''}`}
          onClick={() => {
            if (o.value !== value) playSfx('tap');
            onChange(o.value);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
