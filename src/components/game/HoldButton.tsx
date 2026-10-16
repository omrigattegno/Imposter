/**
 * Big press-and-hold "toy" button; spread `holdProps` from useReveal() on it (press shows, release
 * hides). The eye glyph opens while the secret shows. Children get pointer-events: none (game.css) so
 * every pointer event targets the button itself, which holds the pointer capture.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { IconEye } from './icons';
import '../../styles/game.css';

export interface HoldButtonProps {
  holdProps: HTMLAttributes<HTMLElement>;
  /** True while the secret is showing (styles the button as pressed). */
  active: boolean;
  children: ReactNode;
}

export function HoldButton({ holdProps, active, children }: HoldButtonProps) {
  return (
    <button
      type="button"
      {...holdProps}
      className={`hold-btn no-select ${active ? 'is-active' : ''}`.trim()}
      aria-pressed={active}
      data-testid="hold-button"
    >
      <span className="hold-btn__icon" aria-hidden="true">
        <IconEye open={active} />
      </span>
      <span className="hold-btn__label">{children}</span>
    </button>
  );
}
