import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { playSfx, type SfxName } from '../lib/sfx';
import './Button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'm' | 'l' | 'xl';
  block?: boolean;
  /** Cue played on click ('tap' by default; sounds only when settings.sounds is on). `false` mutes it. */
  sfx?: SfxName | false;
  children: ReactNode;
}

/**
 * Shared chunky "toy" button: a pill with a 6px darker bottom edge that presses in on :active.
 * Tap target is at least 48px; `size="xl"` is the big full-width table action.
 */
export function Button({ variant = 'secondary', size = 'm', block = false, sfx = 'tap', className = '', onClick, ...rest }: ButtonProps) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (sfx) playSfx(sfx);
    onClick?.(e);
  };
  return (
    <button
      type="button"
      {...rest}
      onClick={handleClick}
      className={`btn btn--${variant} btn--${size} ${block ? 'btn--block' : ''} ${className}`.trim()}
    />
  );
}
