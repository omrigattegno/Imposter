/**
 * Vote: each player gets a Pass-to screen, then a private ballot that exists in the DOM only while
 * useReveal says `revealed`. The ballot options show every other player's avatar and name; the chosen
 * one gets a check badge and a tiny hop. The selection lives in component state so it survives
 * lowering and re-lifting; "Lock vote and pass" (shown once a name is chosen, usable with the phone
 * lowered) dispatches CAST_VOTE. After the last voter the engine moves to guess/results by itself.
 * In hold mode a name is tapped with a second finger while the first holds the button; browsers do not
 * synthesise `click` for a secondary touch, so a ballot option also selects on touch/pen `pointerup`.
 */
import { useState } from 'react';
import { Avatar } from '../avatars';
import { Button } from '../components/Button';
import { GameMenu } from '../components/GameMenu';
import { useAvatars } from '../components/game/avatarOf';
import { IconCheck } from '../components/game/icons';
import { PassTo } from '../components/game/PassTo';
import { ProgressDots } from '../components/game/ProgressDots';
import { RevealControls } from '../components/game/RevealControls';
import { SecretCard } from '../components/game/SecretCard';
import { ballotFor, currentVoter } from '../game/engine';
import { useGame } from '../game/store';
import type { Player } from '../game/types';
import { useReveal } from '../hooks/useReveal';
import { useTapGuard } from '../hooks/useTapGuard';
import { useT } from '../i18n';
import { haptic, playSfx } from '../lib/sfx';
import '../styles/game.css';

export function VoteScreen() {
  const { state } = useGame();
  const voter = currentVoter(state);
  const round = state.round;
  if (!voter || !round) return null;
  return <VoteTurn key={`${round.number}:${voter.id}`} voter={voter} />;
}

function VoteTurn({ voter }: { voter: Player }) {
  const t = useT();
  const { state, dispatch } = useGame();
  const avatarOf = useAvatars();
  const round = state.round;
  const [armed, setArmed] = useState(false);
  const { revealed, effectiveMethod, permission, holdProps, needsLower } = useReveal({
    method: state.settings.revealMethod,
    armed,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [guarded, arm] = useTapGuard();

  if (!round) return null;
  const ballot = ballotFor(state, voter.id);
  const progress = t('vote.progress', { current: round.voteIndex + 1, total: round.order.length });

  // A primary touch fires pointerup and then click: the cue plays only when the choice changes.
  const select = (id: string) => {
    if (selected !== id) {
      playSfx('pop');
      haptic('light');
    }
    setSelected(id);
  };

  const lock = () => {
    if (!selected || guarded) return;
    arm();
    dispatch({ type: 'CAST_VOTE', voterId: voter.id, votedId: selected });
  };

  return (
    <main className="screen vote anim-screen-enter" data-testid="vote-screen">
      <div className="game-chrome">
        <span className="game-chrome__label" data-testid="vote-progress">
          <ProgressDots total={round.order.length} current={round.voteIndex} />
          <span>{progress}</span>
        </span>
        <GameMenu />
      </div>

      {!armed ? (
        <PassTo name={voter.name} avatar={avatarOf(voter.id)} method={effectiveMethod} onArmed={() => setArmed(true)} />
      ) : (
        <div className="game-stack anim-fade-in">
          <SecretCard
            revealed={revealed}
            name={voter.name}
            avatar={avatarOf(voter.id)}
            mood="think"
            glow="var(--accent-2)"
            className="secret-card--ballot"
          >
            <div className="ballot" data-testid="vote-ballot">
              <h2 className="ballot__question">{t('vote.question', { name: voter.name })}</h2>
              <p className="ballot__pick">{t('vote.pickOne')}</p>
              <div
                className={`ballot__opts ${ballot.length > 6 ? 'ballot__opts--two' : ''}`.trim()}
                role="radiogroup"
                aria-label={t('vote.question', { name: voter.name })}
              >
                {ballot.map((p) => {
                  const isSelected = selected === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      role="radio"
                      aria-checked={isSelected}
                      className={`ballot__opt ${isSelected ? 'is-selected' : ''}`.trim()}
                      data-testid="ballot-opt"
                      data-player-id={p.id}
                      onClick={() => select(p.id)}
                      onPointerUp={(e) => {
                        // A second finger (or pen) gets pointerup but no click; mouse and keyboard use onClick.
                        if (e.pointerType !== 'mouse') select(p.id);
                      }}
                    >
                      <span className="ballot__opt-face">
                        <Avatar id={avatarOf(p.id)} size={40} mood={isSelected ? 'shocked' : 'idle'} />
                        <span className="ballot__opt-check" aria-hidden="true">
                          <IconCheck />
                        </span>
                      </span>
                      <span className="ballot__opt-name">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </SecretCard>

          <RevealControls
            effectiveMethod={effectiveMethod}
            requestedMethod={state.settings.revealMethod}
            permission={permission}
            holdProps={holdProps}
            revealed={revealed}
            needsLower={needsLower}
            liftHint={t('vote.liftHint')}
            holdHint={t('vote.holdHint')}
            holdLabel={t('vote.holdButton')}
          />

          <div className="reveal__pass">
            {selected !== null && (
              <Button
                variant="primary"
                size="xl"
                block
                className={`vote__lock anim-bounce-in ${guarded ? 'is-guarded' : ''}`.trim()}
                disabled={guarded}
                data-testid="vote-lock"
                onClick={lock}
              >
                {t('vote.lock')}
              </Button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
