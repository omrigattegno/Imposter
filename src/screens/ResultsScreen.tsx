/**
 * Results: a short opening sequence (drumroll; the winner banner bounces in while the Imposter's
 * avatar drops its mask in a spotlight; then the outcome lands: confetti + tada and the table jumping
 * for a table win, womp + a sad wobble and a sneaky Imposter otherwise), the vote tally with avatars,
 * the secret word and the guess line, the scoreboard (points this round + totals, the leader crowned),
 * an optional penalty prompt for the losing side, and the round-end actions (Next round / Players /
 * Settings / End game). The sequence is ~1.5 s, purely visual (every element and button is in the DOM
 * from the first render) and skipped under prefers-reduced-motion.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Avatar, type AvatarMood } from '../avatars';
import { Button } from '../components/Button';
import { Confetti } from '../components/Confetti';
import { GameMenu } from '../components/GameMenu';
import { Modal } from '../components/Modal';
import { TopBar } from '../components/TopBar';
import { useAvatars } from '../components/game/avatarOf';
import { IconSparkle } from '../components/game/icons';
import { PenaltyCard } from '../components/game/PenaltyCard';
import { Scoreboard } from '../components/game/Scoreboard';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { playerName, scoreboard } from '../game/engine';
import { losingSide, penaltyForRound } from '../game/penalties';
import { useGame } from '../game/store';
import type { Winner } from '../game/types';
import { langOfText, useLang, useT } from '../i18n';
import { haptic, playSfx } from '../lib/sfx';
import { useNav } from '../nav';
import '../styles/game.css';

/** 0: drumroll, everything in place but the banner; 1: banner + unmask; 2: the outcome (cheer / womp). */
type Stage = 0 | 1 | 2;
const STAGE_BANNER_MS = 500;
const STAGE_OUTCOME_MS = 1150;

/** Drives the opening sequence; jumps straight to the end under reduced motion. Cues play once each. */
function useOpening(winner: Winner): Stage {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<Stage>(() => (reduced ? 2 : 0));
  const drumRef = useRef(false);
  const cuesRef = useRef({ unmask: false, outcome: false });

  useEffect(() => {
    if (reduced) {
      setStage(2);
      return;
    }
    if (!drumRef.current) {
      drumRef.current = true;
      playSfx('drumroll');
    }
    const banner = setTimeout(() => setStage((s) => (s < 1 ? 1 : s)), STAGE_BANNER_MS);
    const outcome = setTimeout(() => setStage(2), STAGE_OUTCOME_MS);
    return () => {
      clearTimeout(banner);
      clearTimeout(outcome);
    };
  }, [reduced]);

  useEffect(() => {
    if (stage >= 1 && !cuesRef.current.unmask) {
      cuesRef.current.unmask = true;
      if (!reduced) {
        playSfx('unmask');
        haptic('medium');
      }
    }
    if (stage >= 2 && !cuesRef.current.outcome) {
      cuesRef.current.outcome = true;
      if (winner === 'table') {
        playSfx('tada');
        haptic('success');
      } else {
        playSfx('womp');
        haptic('warning');
      }
    }
  }, [stage, winner, reduced]);

  return stage;
}

export function ResultsScreen() {
  const t = useT();
  const lang = useLang();
  const { state, dispatch, startRound } = useGame();
  const { go, reset } = useNav();
  const avatarOf = useAvatars();
  const [confirmEnd, setConfirmEnd] = useState(false);

  const round = state.round;
  const outcome = round?.outcome ?? null;
  const penaltyKind = round?.config.penalty ?? 'off';
  const stage = useOpening(outcome?.winner ?? 'table');

  if (!round || !outcome) return null;

  // One prompt per round: a pure function of the round, so Home -> Resume or a reload shows the same one.
  const prompt = penaltyKind === 'off' ? null : penaltyForRound(penaltyKind, lang, round);

  const name = (id: string) => playerName(state, id);
  const imposterNames = round.imposterIds.map(name);
  const multi = round.imposterIds.length > 1;
  const tableWin = outcome.winner === 'table';
  const outcomeShown = stage >= 2;
  const tableIds = round.order.filter((id) => !round.imposterIds.includes(id));
  const tableMood: AvatarMood = !outcomeShown ? 'idle' : tableWin ? 'happy' : 'sad';
  // Mounted unmasked with mood 'idle' the avatar shows the "caught" face until the outcome lands.
  const imposterMood: AvatarMood = !outcomeShown ? 'idle' : tableWin ? 'sad' : 'sneaky';

  const winnerText =
    outcome.winner === 'table' ? t('results.tableWins') : multi ? t('results.impostersWin') : t('results.imposterWins');
  const subText =
    outcome.winner === 'table'
      ? outcome.guessCorrect === false
        ? t('results.subCaughtWrongGuess')
        : t('results.subCaught')
      : outcome.tie
        ? t('results.subTie')
        : outcome.imposterCaught
          ? t('results.subGuessed')
          : t('results.subWrongPlayer');

  const tally = Object.entries(outcome.tally)
    .map(([id, n]) => ({ id, name: name(id), n, imposter: round.imposterIds.includes(id) }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  const maxVotes = tally.reduce((m, r) => Math.max(m, r.n), 1);

  const guessLine = (() => {
    if (round.guess === null) return null;
    const guesser = name(outcome.votedOutId ?? round.imposterIds[0]);
    if (!round.guess.trim()) return { text: t('results.gaveUp', { name: guesser }), kind: 'wrong' as const };
    return outcome.guessCorrect
      ? { text: t('results.guessCorrect', { name: guesser, guess: round.guess }), kind: 'correct' as const }
      : { text: t('results.guessWrong', { name: guesser, guess: round.guess }), kind: 'wrong' as const };
  })();

  const loserIds = losingSide(round);
  const losers = loserIds.map(name);

  const endGame = () => {
    setConfirmEnd(false);
    dispatch({ type: 'END_GAME' });
    reset('home');
  };

  return (
    <main className="screen results anim-screen-enter" data-testid="results-screen" data-stage={stage}>
      <TopBar title={t('common.round', { n: round.number })} trailing={<GameMenu />} />
      <div className="game-stack">
        <section
          className={`results__banner results__banner--${outcome.winner} ${stage >= 1 ? 'anim-bounce-in' : 'is-waiting'}`}
          aria-live="polite"
          data-testid="results-banner"
          data-winner={outcome.winner}
        >
          <Confetti fire={outcomeShown && tableWin} />
          <div className="results__spotlight" data-unmasked={stage >= 1 ? 'true' : 'false'}>
            {round.imposterIds.map((id) => (
              <Avatar
                key={id}
                id={avatarOf(id)}
                size={multi ? 96 : 124}
                mood={imposterMood}
                unmasked={stage >= 1}
                animate={outcomeShown && !tableWin ? 'wiggle' : 'none'}
              />
            ))}
            {stage >= 1 && (
              <span className="results__sticker anim-bounce-in anim-delay-4" aria-hidden="true">
                {t('results.unmasked')}
              </span>
            )}
          </div>
          <p className="results__imposters">
            {multi
              ? t('results.impostersWere', { names: imposterNames.join(', ') })
              : t('results.imposterWas', { name: imposterNames[0] ?? '?' })}
          </p>
          <h2 className="results__winner" data-testid="results-winner">
            <IconSparkle className="results__sparkle" />
            {winnerText}
          </h2>
          <p className="results__sub">{subText}</p>
          <ul className="results__table" aria-label={t('results.tableLabel')}>
            {tableIds.map((id, i) => (
              <li
                key={id}
                className={`results__seat ${outcomeShown && !tableWin ? 'anim-wobble' : ''}`.trim()}
                style={{ animationDelay: `${i * 140}ms` } as CSSProperties}
              >
                <Avatar
                  id={avatarOf(id)}
                  size={52}
                  mood={tableMood}
                  animate={outcomeShown && tableWin ? 'jump' : 'none'}
                  style={{ animationDelay: `${i * 110}ms` }}
                  label={name(id)}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="card anim-slide-up anim-delay-1" aria-label={t('results.votes')}>
          <h3 className="card__title">{t('results.votes')}</h3>
          <p className="results__voted">
            {outcome.tie || !outcome.votedOutId
              ? t('results.tie')
              : t('results.votedOut', { name: name(outcome.votedOutId) })}
          </p>
          <ul className="tally">
            {tally.map((row) => (
              <li key={row.id} className={`tally__row ${row.id === outcome.votedOutId ? 'is-out' : ''}`.trim()}>
                <span className="tally__face">
                  <Avatar id={avatarOf(row.id)} size={32} mood={row.imposter ? 'sneaky' : 'idle'} />
                </span>
                <span className="tally__main">
                  <span className="tally__name">
                    {row.name}
                    {row.imposter && <span className="badge badge--imposter">{t('results.imposterBadge')}</span>}
                  </span>
                  <span className="tally__bar" aria-hidden="true">
                    <i style={{ width: `${Math.round((row.n / maxVotes) * 100)}%` }} />
                  </span>
                </span>
                <span className="tally__count">
                  {row.n === 1 ? t('results.voteCountOne') : t('results.voteCount', { n: row.n })}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card results__wordcard anim-slide-up anim-delay-2" aria-label={t('results.secretWord')}>
          <h3 className="card__title">{t('results.secretWord')}</h3>
          <p className="results__word" lang={langOfText(round.word.word)} dir="auto" data-testid="results-word">
            {round.word.word}
          </p>
          <p className="muted text-center">{t('reveal.category', { name: round.categoryName })}</p>
          {guessLine && <p className={`results__guess results__guess--${guessLine.kind}`}>{guessLine.text}</p>}
        </section>

        <section className="card anim-slide-up anim-delay-3" aria-label={t('results.scoreboard')} data-testid="results-scoreboard">
          <h3 className="card__title">{t('results.scoreboard')}</h3>
          <div className="scoreboard__head" aria-hidden="true">
            <span />
            <span />
            <span />
            <span className="scoreboard__earned faint">{t('results.colRound')}</span>
            <span className="scoreboard__total faint">{t('results.colTotal')}</span>
          </div>
          <Scoreboard rows={scoreboard(state)} roundPoints={outcome.points} imposterIds={round.imposterIds} />
        </section>

        {penaltyKind !== 'off' && prompt && (
          <PenaltyCard kind={penaltyKind} prompt={prompt} loserNames={losers} loserIds={loserIds} />
        )}

        <div className="game-actions">
          <Button variant="primary" size="xl" block data-testid="results-next" onClick={() => startRound()}>
            {t('results.nextRound')}
          </Button>
          <div className="game-actions__row">
            <Button data-testid="results-players" onClick={() => dispatch({ type: 'EDIT_PLAYERS' })}>
              {t('common.players')}
            </Button>
            <Button data-testid="results-settings" onClick={() => go('settings')}>
              {t('common.settings')}
            </Button>
            <Button variant="ghost" data-testid="results-end" onClick={() => setConfirmEnd(true)}>
              {t('results.endGame')}
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={confirmEnd}
        title={t('menu.endGame')}
        confirmLabel={t('menu.endGame')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={endGame}
        onCancel={() => setConfirmEnd(false)}
      >
        {t('menu.endGameConfirm')}
      </Modal>
    </main>
  );
}
