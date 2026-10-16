/**
 * Clue turn order as a wrapping row of small avatars with the name under each: the current speaker
 * is lifted and ringed in the accent, done ones are dimmed and ticked, upcoming ones numbered.
 */
import type { CSSProperties } from 'react';
import { Avatar, type AvatarId } from '../../avatars';
import { useT } from '../../i18n';
import '../../styles/game.css';

export type TurnStatus = 'done' | 'current' | 'todo';

export interface TurnOrderItem {
  id: string;
  name: string;
  avatar?: AvatarId;
  status: TurnStatus;
}

export function TurnOrder({ items }: { items: TurnOrderItem[] }) {
  const t = useT();
  return (
    <ol className="turn-list" aria-label={t('clues.order')}>
      {items.map((it, i) => (
        <li key={it.id} className={`turn-seat is-${it.status}`} aria-current={it.status === 'current' ? 'step' : undefined}>
          {/* The entrance animates the face, not the seat: the seat's own transform is the "lifted" state. */}
          <span className="turn-seat__face anim-pop-in" style={{ animationDelay: `${i * 60}ms` } as CSSProperties}>
            <Avatar id={it.avatar} size={40} mood={it.status === 'current' ? 'happy' : 'idle'} animate={it.status === 'current' ? 'bob' : 'none'} />
            <span className="turn-seat__n" aria-hidden="true">
              {it.status === 'done' ? '✓' : i + 1}
            </span>
          </span>
          <span className="turn-seat__name">{it.name}</span>
        </li>
      ))}
    </ol>
  );
}
