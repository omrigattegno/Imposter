/**
 * Bottom sheet for choosing a player's character: all twelve of the cast in a grid, the player's own
 * one highlighted, the ones other players hold dimmed with the owner's name (tapping one swaps the two,
 * the reducer's SET_AVATAR rule). Reuses Modal.css's sheet shell (.modal__backdrop / .modal) so it
 * rises and bounces like the confirm dialogs. Open while `player` is set; Escape, the backdrop, Close
 * and a pick all close it.
 */
import { useEffect, type CSSProperties } from 'react';
import { AVATAR_IDS, AVATARS, Avatar, type AvatarId } from '../../avatars';
import type { Player } from '../../game/types';
import { useT, type MessageKey } from '../../i18n';
import { haptic, playSfx } from '../../lib/sfx';
import { Button } from '../Button';

export interface AvatarPickerProps {
  /** The player choosing; null keeps the sheet closed. */
  player: Player | null;
  players: readonly Player[];
  onSelect: (avatar: AvatarId) => void;
  onClose: () => void;
}

export function AvatarPicker({ player, players, onSelect, onClose }: AvatarPickerProps) {
  const t = useT();
  const open = player !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!player) return null;

  const owners = new Map<string, Player>();
  for (const p of players) if (p.avatar) owners.set(p.avatar, p);
  const title = t('setup.pickAvatarTitle', { name: player.name });

  return (
    <div className="modal__backdrop" onClick={onClose} role="presentation">
      <div
        className="modal apicker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apicker-title"
        data-testid="avatar-picker"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="apicker-title" className="modal__title">
          {title}
        </h2>
        <p className="apicker__hint">{t('setup.pickAvatarHint')}</p>

        <div className="apicker__grid stagger" role="radiogroup" aria-label={title} style={{ '--stagger-step': '30ms' } as CSSProperties}>
          {AVATAR_IDS.map((id, i) => {
            const owner = owners.get(id);
            const mine = owner?.id === player.id;
            const taken = owner !== undefined && !mine;
            const name = t(`avatar.${id}` as MessageKey);
            const label = mine
              ? `${name}, ${t('setup.avatarCurrent')}`
              : taken
                ? `${name}, ${t('setup.avatarTakenBy', { name: owner.name })}`
                : name;
            return (
              <button
                type="button"
                key={id}
                role="radio"
                aria-checked={mine}
                aria-label={label}
                data-testid="avatar-opt"
                data-avatar={id}
                data-taken={taken ? 'true' : undefined}
                className={`apicker__opt anim-pop-in ${mine ? 'is-current' : ''} ${taken ? 'is-taken' : ''}`.trim()}
                style={{ '--i': i, '--av-color': AVATARS[id].color } as CSSProperties}
                autoFocus={mine}
                onClick={() => {
                  playSfx('pop');
                  haptic('light');
                  onSelect(id);
                }}
              >
                <span className="apicker__face">
                  <Avatar id={id} size={56} mood={mine ? 'happy' : 'idle'} />
                </span>
                <span className="apicker__name">{name}</span>
                <span className="apicker__owner">{mine ? t('setup.avatarCurrent') : taken ? owner.name : ' '}</span>
              </button>
            );
          })}
        </div>

        <div className="apicker__actions">
          <Button variant="secondary" size="l" block onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}
