/**
 * The black private card used by Reveal and Vote. While `revealed` is false the children are NOT
 * rendered at all (only decorative blurred bars), so the secret never exists in the DOM when the
 * phone is flat. The player's small avatar sits at the top; its `mood` (sneaky for the Imposter,
 * happy for a word holder) and the glow colour are applied ONLY while revealed, so neither the SVG's
 * data-mood nor a style can leak the role while the card is hidden. Each reveal scales the card in
 * with a glow, plays the 'reveal' cue and a light haptic. Text selection and the iOS callout are
 * disabled on the whole card.
 */
import { useEffect, useRef, type CSSProperties, type ReactNode, type SyntheticEvent } from 'react';
import { Avatar, type AvatarMood } from '../../avatars';
import { haptic, playSfx, type SfxName } from '../../lib/sfx';
import '../../styles/game.css';

export interface SecretCardProps {
  revealed: boolean;
  /** Small line at the top of the card (the player's name). */
  name: string;
  /** The player's avatar id (AVATAR_IDS), shown small next to the name. */
  avatar?: string;
  /** The avatar's face while the card shows (idle while hidden, whatever this says). */
  mood?: AvatarMood;
  /** Glow colour while revealed (any CSS colour); the accent by default. Never applied while hidden. */
  glow?: string;
  /** Cue played on each reveal ('reveal' by default; `false` mutes it). */
  sfx?: SfxName | false;
  className?: string;
  children: ReactNode;
}

function prevent(e: SyntheticEvent) {
  e.preventDefault();
}

export function SecretCard({ revealed, name, avatar, mood = 'happy', glow, sfx = 'reveal', className = '', children }: SecretCardProps) {
  const wasRevealed = useRef(revealed);
  useEffect(() => {
    if (revealed && !wasRevealed.current) {
      if (sfx) playSfx(sfx);
      haptic('light');
    }
    wasRevealed.current = revealed;
  }, [revealed, sfx]);

  const style = revealed && glow ? ({ '--glow-color': glow } as CSSProperties) : undefined;
  return (
    <div
      className={`secret-card no-select ${revealed ? 'is-revealed' : 'is-hidden'} ${className}`.trim()}
      style={style}
      data-testid="secret-card"
      data-revealed={revealed ? 'true' : 'false'}
      onContextMenu={prevent}
      onDragStart={prevent}
    >
      <div className="secret-card__head">
        <span className="secret-card__face">
          <Avatar id={avatar} size={34} mood={revealed ? mood : 'idle'} />
        </span>
        <span className="secret-card__name">{name}</span>
      </div>
      <div className="secret-card__body">
        {revealed ? (
          children
        ) : (
          <div className="secret-card__placeholder" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
    </div>
  );
}

/** Size modifier for a word so a long single token (e.g. a 14-letter Hebrew word) fits 375px without clipping. */
export function wordSizeClass(word: string): string {
  const longest = word.split(/\s+/).reduce((m, w) => Math.max(m, w.length), 0);
  if (longest >= 13) return 'secret-word--xlong';
  if (longest >= 9) return 'secret-word--long';
  return '';
}
