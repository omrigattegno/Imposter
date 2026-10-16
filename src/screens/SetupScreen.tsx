/**
 * Setup: players (add / remove / rename / reorder / pick a character), category, Start.
 * Start runs unlockAudio() and, in lift mode, requestSensorPermission() synchronously inside the tap
 * (iOS needs the gesture), then startRound() + reset('game'). Last game's names are pre-filled by
 * bootState() (store.tsx) once per boot, so a list the host clears here stays cleared. Avatars are
 * assigned by the store (addPlayer / bootState); the picker only dispatches SET_AVATAR.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Avatar } from '../avatars';
import { Button } from '../components/Button';
import { TopBar } from '../components/TopBar';
import { AvatarPicker } from '../components/pregame/AvatarPicker';
import { BackButton } from '../components/pregame/BackButton';
import { CategoryPicker } from '../components/pregame/CategoryPicker';
import { PlayerList } from '../components/pregame/PlayerList';
import { IconGear, IconPlus } from '../components/pregame/icons';
import { MAX_NAME_LENGTH, MAX_PLAYERS, MIN_PLAYERS, MIN_PLAYERS_FOR_TWO_IMPOSTERS } from '../game/constants';
import { canStart, validatePlayerName, type NameError } from '../game/engine';
import { useGame } from '../game/store';
import { RANDOM_CATEGORY } from '../game/types';
import { useT, type MessageKey } from '../i18n';
import { unlockAudio } from '../lib/audio';
import { haptic, playSfx } from '../lib/sfx';
import { probeSensors, requestSensorPermission } from '../lib/sensors';
import { useNav } from '../nav';
import '../styles/pregame.css';

const ERROR_KEY: Record<NameError, MessageKey> = {
  empty: 'setup.err.empty',
  too_long: 'setup.err.too_long',
  duplicate: 'setup.err.duplicate',
  too_many: 'setup.err.too_many',
};

export function SetupScreen() {
  const t = useT();
  const { state, dispatch, addPlayer, packs, startRound } = useGame();
  const { go, reset } = useNav();
  const { players, settings } = state;
  const locked = state.phase !== 'setup';

  const [name, setName] = useState('');
  const [error, setError] = useState<NameError | null>(null);
  // Bumped on every rejected name so the error line re-mounts and shakes again.
  const [errorCount, setErrorCount] = useState(0);
  const [starting, setStarting] = useState(false);
  const [pickFor, setPickFor] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reject = (err: NameError) => {
    setError(err);
    setErrorCount((n) => n + 1);
    haptic('warning');
  };

  const submitName = (e?: FormEvent) => {
    e?.preventDefault();
    if (locked) return;
    const err = addPlayer(name);
    if (err) {
      reject(err);
    } else {
      playSfx('pop');
      haptic('light');
      setName('');
      setError(null);
    }
    inputRef.current?.focus();
  };

  // Each new row is inserted above the add field and browsers only scroll a field into view on focus,
  // so after a successful add bring it back above the on-screen keyboard. Only while it is the active
  // element, so a tap on a row button (remove) never scrolls.
  useEffect(() => {
    const el = inputRef.current;
    if (el && document.activeElement === el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'center' });
    }
  }, [players.length]);

  /** Inline rename from the list; returns false (editor stays open) when the name is rejected. */
  const renamePlayer = (id: string, newName: string): boolean => {
    if (locked) return true;
    const err = validatePlayerName(players, newName, id);
    if (err) {
      reject(err);
      return false;
    }
    setError(null);
    dispatch({ type: 'RENAME_PLAYER', id, name: newName });
    return true;
  };

  const picking = pickFor === null ? null : (players.find((p) => p.id === pickFor) ?? null);

  const ready = canStart(state) && !locked;
  const selectedCategory = packs.some((p) => p.id === settings.categoryId) ? settings.categoryId : RANDOM_CATEGORY;
  const twoImpostersShort =
    settings.imposterCount === 2 && players.length >= MIN_PLAYERS && players.length < MIN_PLAYERS_FOR_TWO_IMPOSTERS;
  const continuing = state.history.length > 0;
  const full = players.length >= MAX_PLAYERS;

  const onStart = () => {
    if (!ready || starting) return;
    // Both must run inside the tap: WebAudio and iOS motion permission need a user gesture.
    unlockAudio();
    haptic('medium');
    setStarting(true);
    const launch = () => {
      try {
        startRound();
        reset('game');
      } catch (err) {
        console.error(err);
        setStarting(false);
      }
    };
    if (settings.revealMethod === 'lift') {
      // The "does this device deliver readings?" probe runs during the Pass-to countdown (not awaited),
      // so player 1's hint and card start in the right mode on sensorless devices.
      requestSensorPermission().then(() => {
        void probeSensors();
        launch();
      }, launch);
    } else {
      launch();
    }
  };

  return (
    <main className="screen setup anim-screen-enter" data-testid="setup-screen">
      <TopBar
        leading={<BackButton onClick={() => reset('home')} testId="setup-back" />}
        title={continuing ? t('common.round', { n: state.history.length + 1 }) : t('setup.title')}
        trailing={
          <Button
            variant="ghost"
            sfx="whoosh"
            aria-label={t('common.settings')}
            data-testid="setup-settings"
            onClick={() => go('settings')}
          >
            <IconGear />
          </Button>
        }
      />

      <div className="setup__body">
        {locked && (
          <div className="notice anim-slide-up" role="status">
            <span>{t('setup.inProgress')}</span>
            <Button variant="primary" sfx="whoosh" data-testid="setup-resume" onClick={() => reset('game')}>
              {t('setup.resume')}
            </Button>
          </div>
        )}

        <section className="pg-section anim-slide-up" aria-labelledby="setup-players">
          <div className="pg-section__head">
            <h2 id="setup-players" className="pg-section__title">
              {t('common.players')}
            </h2>
            <span className={`pg-counter ${players.length >= MIN_PLAYERS ? 'is-ready' : ''}`.trim()}>
              {t('setup.counter', { n: players.length, max: MAX_PLAYERS })}
            </span>
          </div>

          {players.length === 0 ? (
            <div className="setup__empty">
              <span className="setup__emptyFaces" aria-hidden="true">
                <Avatar id="cloud" size={56} mood="think" animate="bob" />
                <Avatar id="kiwi" size={56} mood="happy" animate="bob" style={{ animationDelay: '-1.4s' }} />
              </span>
              <p className="setup__emptyText">{t('setup.emptyPlayers')}</p>
            </div>
          ) : (
            <>
              <PlayerList
                players={players}
                disabled={locked}
                onReorder={(ids) => dispatch({ type: 'REORDER_PLAYERS', ids })}
                onRemove={(id) => dispatch({ type: 'REMOVE_PLAYER', id })}
                onRename={renamePlayer}
                onPickAvatar={(id) => setPickFor(id)}
              />
              <p className="pg-muted setup__listHint">
                {t('setup.seatingHint')}
                {!locked && <> · {t('setup.renameHint')}</>}
              </p>
            </>
          )}

          <form className="addform" onSubmit={submitName} noValidate>
            <input
              ref={inputRef}
              className="input addform__input"
              data-testid="setup-name-input"
              type="text"
              value={name}
              placeholder={t('setup.namePlaceholder')}
              aria-label={t('setup.namePlaceholder')}
              aria-invalid={error !== null}
              autoComplete="off"
              autoCapitalize="words"
              autoCorrect="off"
              enterKeyHint="done"
              disabled={locked || full}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
            />
            <Button type="submit" variant="secondary" sfx={false} className="addform__btn" data-testid="setup-add" disabled={locked || full}>
              <IconPlus size={20} />
              {t('setup.add')}
            </Button>
          </form>
          {error && (
            <p key={errorCount} className="field-error anim-shake" role="alert">
              {t(ERROR_KEY[error], { max: error === 'too_long' ? MAX_NAME_LENGTH : MAX_PLAYERS })}
            </p>
          )}
        </section>

        <section className="pg-section anim-slide-up anim-delay-1" aria-labelledby="setup-category">
          <h2 id="setup-category" className="pg-section__title">
            {t('setup.category')}
          </h2>
          <CategoryPicker
            packs={packs}
            selectedId={selectedCategory}
            onSelect={(categoryId) => dispatch({ type: 'UPDATE_SETTINGS', patch: { categoryId } })}
          />
        </section>
      </div>

      <div className="pg-grow" />

      <div className="setup__footer">
        <p className={`setup__hint ${twoImpostersShort ? 'setup__hint--warn' : ''}`.trim()} aria-live="polite">
          {players.length < MIN_PLAYERS
            ? t('setup.needPlayers', { min: MIN_PLAYERS })
            : twoImpostersShort
              ? t('setup.twoImpostersHint', { min: MIN_PLAYERS_FOR_TWO_IMPOSTERS })
              : ''}
        </p>
        <Button
          variant="primary"
          size="xl"
          block
          sfx="whoosh"
          data-testid="setup-start"
          disabled={!ready || starting}
          onClick={onStart}
        >
          {starting ? t('setup.starting') : t('setup.start')}
        </Button>
        <div className="setup__links">
          <Button variant="ghost" sfx="whoosh" data-testid="setup-howto" onClick={() => go('howto')}>
            {t('common.howToPlay')}
          </Button>
        </div>
      </div>

      <AvatarPicker
        player={picking}
        players={players}
        onSelect={(avatar) => {
          if (picking) dispatch({ type: 'SET_AVATAR', id: picking.id, avatar });
          setPickFor(null);
        }}
        onClose={() => setPickFor(null)}
      />
    </main>
  );
}
