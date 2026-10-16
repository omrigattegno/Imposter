/**
 * Clue rounds: the table reads this together. The speaker's avatar stands large under a speech bubble
 * (the hint on the very first turn, "talking" dots afterwards), the turn order is a row of small
 * avatars (done / current / upcoming), the clue-round counter is a chip, and a big Next (CLUE_NEXT).
 * On the last turn the button becomes "Start discussion" (or "Go to vote" when the discussion timer
 * is off). Next is tap-guarded: a double tap cannot skip a speaker or, on the last turn, the discussion.
 */
import { Avatar } from '../avatars';
import { Button } from '../components/Button';
import { GameMenu } from '../components/GameMenu';
import { TopBar } from '../components/TopBar';
import { useAvatars } from '../components/game/avatarOf';
import { SpeechBubble } from '../components/game/SpeechBubble';
import { TurnOrder, type TurnOrderItem } from '../components/game/TurnOrder';
import { clueOrder, currentSpeaker, playerName } from '../game/engine';
import { useGame } from '../game/store';
import { useTapGuard } from '../hooks/useTapGuard';
import { useT } from '../i18n';
import { unlockAudio } from '../lib/audio';
import '../styles/game.css';

export function CluesScreen() {
  const t = useT();
  const { state, dispatch } = useGame();
  const avatarOf = useAvatars();
  const [guarded, arm] = useTapGuard();
  const round = state.round;
  const speaker = currentSpeaker(state);
  if (!round || !speaker) return null;

  const order = clueOrder(round);
  const n = order.length;
  const firstTurn = round.clueRound === 1 && round.clueTurn === 0;
  const lastTurn = round.clueRound === round.config.clueRounds && round.clueTurn === n - 1;

  const items: TurnOrderItem[] = order.map((id, i) => ({
    id,
    name: playerName(state, id),
    avatar: avatarOf(id),
    status: i < round.clueTurn ? 'done' : i === round.clueTurn ? 'current' : 'todo',
  }));

  const nextLabel = lastTurn
    ? round.config.discussionSeconds === 0
      ? t('clues.goToVote')
      : t('clues.startDiscussion')
    : t('common.next');

  const onNext = () => {
    if (guarded) return;
    arm();
    // Any tap before the discussion timer unlocks WebAudio on iOS so the 10-second beep can sound.
    unlockAudio();
    dispatch({ type: 'CLUE_NEXT' });
  };

  return (
    <main className="screen clues anim-screen-enter" data-testid="clues-screen">
      <TopBar title={t('common.round', { n: round.number })} trailing={<GameMenu />} />
      <div className="game-stack">
        <p className="clues__round">
          <span className="round-chip" data-testid="clues-round">
            {t('clues.round', { k: round.clueRound, total: round.config.clueRounds })}
          </span>
        </p>

        <section className="clues__stage" aria-live="polite">
          {/* Keyed per turn so the bubble and the avatar pop in for every new speaker. */}
          <div className="clues__scene" key={`${round.clueRound}:${round.clueTurn}`}>
            <SpeechBubble dots={!firstTurn} className="clues__bubble">
              {firstTurn ? t('clues.hint') : <span className="visually-hidden">{t('clues.speaking')}</span>}
            </SpeechBubble>
            <div className="clues__avatar anim-pop-in">
              <Avatar id={avatarOf(speaker.id)} size={136} mood="happy" animate="bob" />
            </div>
          </div>
          <div className="clues__speaker-label">
            {firstTurn ? t('clues.starts', { name: speaker.name }) : t('clues.nowSpeaking')}
          </div>
          <h2 className="clues__speaker-name" data-testid="clues-speaker">
            {speaker.name}
          </h2>
        </section>

        <TurnOrder items={items} />

        {!firstTurn && <p className="clues__hint">{t('clues.hint')}</p>}

        <div className="game-actions">
          <Button
            variant="primary"
            size="xl"
            block
            className={guarded ? 'is-guarded' : ''}
            disabled={guarded}
            data-testid="clues-next"
            onClick={onNext}
          >
            {nextLabel}
          </Button>
        </div>
      </div>
    </main>
  );
}
