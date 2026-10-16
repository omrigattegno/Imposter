/**
 * A speech bubble above the speaker's avatar: the hint text, or three bouncing dots ("talking") with
 * the children (e.g. a visually-hidden "Speaking") as the accessible text.
 */
import type { ReactNode } from 'react';
import '../../styles/game.css';

export interface SpeechBubbleProps {
  children?: ReactNode;
  /** Show an animated ellipsis; the children then serve as the (hidden) accessible text. */
  dots?: boolean;
  className?: string;
}

export function SpeechBubble({ children, dots = false, className = '' }: SpeechBubbleProps) {
  return (
    <div className={`bubble ${dots ? 'bubble--dots' : ''} ${className}`.trim()}>
      {dots && (
        <span className="bubble__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
      {children}
    </div>
  );
}
