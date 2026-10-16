/** Results penalty prompt (dare / drink) for the losing side, with the losers' avatars looking sad. */
import { Avatar } from '../../avatars';
import type { PenaltyKind } from '../../game/penalties';
import { useT } from '../../i18n';
import { useAvatars } from './avatarOf';
import '../../styles/game.css';

export interface PenaltyCardProps {
  kind: PenaltyKind;
  prompt: string;
  loserNames: string[];
  /** Player ids of the losing side (for the avatars); optional for callers that only have names. */
  loserIds?: readonly string[];
}

export function PenaltyCard({ kind, prompt, loserNames, loserIds = [] }: PenaltyCardProps) {
  const t = useT();
  const avatarOf = useAvatars();
  const title = kind === 'dare' ? t('penalty.dareTitle') : t('penalty.drinkTitle');
  return (
    <section className={`card penalty penalty--${kind} anim-slide-up`} aria-label={title}>
      <h2 className="card__title penalty__title">
        <span className="penalty__glyph" aria-hidden="true" />
        {title}
      </h2>
      <p className="penalty__prompt">{prompt}</p>
      {loserNames.length > 0 && (
        <div className="penalty__losers">
          {loserIds.length > 0 && (
            <span className="penalty__faces" aria-hidden="true">
              {loserIds.map((id) => (
                <Avatar key={id} id={avatarOf(id)} size={32} mood="sad" />
              ))}
            </span>
          )}
          <span>{t('penalty.losers', { names: loserNames.join(', ') })}</span>
        </div>
      )}
    </section>
  );
}
