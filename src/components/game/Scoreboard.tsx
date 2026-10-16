/**
 * Results scoreboard: rank, avatar, name, points earned this round, running total. Leaders are
 * highlighted, their avatar smiles and wears a (CSS) crown.
 */
import type { CSSProperties } from 'react';
import { Avatar } from '../../avatars';
import type { Player } from '../../game/types';
import { useT } from '../../i18n';
import { useAvatars } from './avatarOf';
import '../../styles/game.css';

export interface ScoreboardProps {
  /** Already sorted (scoreboard(state)). */
  rows: Array<{ player: Player; score: number }>;
  /** playerId -> points earned this round (outcome.points). */
  roundPoints?: Record<string, number>;
  /** Imposter ids this round (shown with a badge). */
  imposterIds?: readonly string[];
}

export function Scoreboard({ rows, roundPoints, imposterIds = [] }: ScoreboardProps) {
  const t = useT();
  const avatarOf = useAvatars();
  const max = rows.reduce((m, r) => Math.max(m, r.score), 0);
  return (
    <ol className="scoreboard stagger" aria-label={t('results.scoreboard')}>
      {rows.map(({ player, score }, i) => {
        const leader = max > 0 && score === max;
        const imposter = imposterIds.includes(player.id);
        const earned = roundPoints?.[player.id] ?? 0;
        return (
          <li
            key={player.id}
            className={`scoreboard__row anim-slide-up ${leader ? 'is-leader' : ''}`.trim()}
            style={{ '--i': i } as CSSProperties}
          >
            <span className="scoreboard__rank" aria-hidden="true">
              {i + 1}
            </span>
            <span className="scoreboard__face">
              {leader && <span className="crown" aria-hidden="true" />}
              <Avatar id={avatarOf(player.id)} size={36} mood={leader ? 'happy' : imposter ? 'sneaky' : 'idle'} />
            </span>
            <span className="scoreboard__name">
              <span className="scoreboard__name-text">{player.name}</span>
              {imposter && <span className="badge badge--imposter">{t('results.imposterBadge')}</span>}
              {leader && <span className="visually-hidden">{t('results.leader')}</span>}
            </span>
            <span className={`scoreboard__earned ${earned > 0 ? 'is-positive' : ''}`.trim()}>
              {earned > 0 ? t('results.plus', { n: earned }) : ''}
            </span>
            <span className="scoreboard__total">{t('results.pts', { n: score })}</span>
          </li>
        );
      })}
    </ol>
  );
}
