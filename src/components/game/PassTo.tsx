/**
 * "Pass to {name}" screen shown before a private Reveal or Vote turn.
 * The next player's avatar floats large above their name; a 3-second anti-peek countdown
 * (PASS_COUNTDOWN_SECONDS) runs in a pulsing ring with a tick on 3-2-1, and `onArmed()` fires once
 * when it reaches zero. A whoosh plays on mount (the phone changes hands). Nothing secret is rendered here.
 */
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '../../avatars';
import { PASS_COUNTDOWN_SECONDS } from '../../game/constants';
import { useT } from '../../i18n';
import { playSfx } from '../../lib/sfx';
import { Ring } from './Ring';
import { useCountdown } from './useCountdown';
import '../../styles/game.css';

export interface PassToProps {
  name: string;
  /** The player's avatar id (AVATAR_IDS); shown large and bobbing. */
  avatar?: string;
  /** Effective reveal method: decides which hint is shown. */
  method: 'lift' | 'hold';
  /** Called exactly once when the countdown reaches zero. */
  onArmed: () => void;
  /** Small progress label, e.g. "2 of 6". */
  progress?: string;
}

export function PassTo({ name, avatar, method, onArmed, progress }: PassToProps) {
  const t = useT();
  const total = PASS_COUNTDOWN_SECONDS * 1000;
  const [endAt] = useState(() => Date.now() + total);
  const remaining = useCountdown(endAt, 100);
  const seconds = Math.ceil(remaining / 1000);

  // Latest callback without re-running the effect; fire once per mount even under StrictMode.
  const onArmedRef = useRef(onArmed);
  onArmedRef.current = onArmed;
  const firedRef = useRef(false);
  useEffect(() => {
    if (remaining > 0 || firedRef.current) return;
    firedRef.current = true;
    onArmedRef.current();
  }, [remaining]);

  // Sound: one whoosh as the phone changes hands, one tick per remaining second (3, 2, 1). The refs
  // keep StrictMode's doubled effects from playing a cue twice.
  const whooshedRef = useRef(false);
  useEffect(() => {
    if (whooshedRef.current) return;
    whooshedRef.current = true;
    playSfx('whoosh');
  }, []);
  const tickedRef = useRef<number | null>(null);
  useEffect(() => {
    if (seconds < 1 || seconds > PASS_COUNTDOWN_SECONDS || tickedRef.current === seconds) return;
    tickedRef.current = seconds;
    playSfx('tick');
  }, [seconds]);

  return (
    <section className="pass" aria-label={t('pass.to', { name })} data-testid="pass-screen">
      {progress && <div className="pass__progress">{progress}</div>}
      <div className="pass__avatar anim-pop-in">
        <Avatar id={avatar} size={160} mood="happy" animate="bob" />
      </div>
      <div className="pass__label">{t('pass.title')}</div>
      <h1 className="pass__name" data-testid="pass-name">
        {name}
      </h1>
      <p className="pass__hint">{method === 'lift' ? t('pass.hintLift') : t('pass.hintHold')}</p>
      <Ring
        fraction={remaining / total}
        size={104}
        stroke={9}
        className="pass__ring anim-pulse"
        ariaLabel={t('pass.countdownAria', { n: seconds })}
      >
        <span className="pass__count tabular" aria-hidden="true" data-testid="pass-count">
          {seconds}
        </span>
      </Ring>
    </section>
  );
}
