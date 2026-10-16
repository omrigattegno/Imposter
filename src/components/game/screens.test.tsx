// @vitest-environment jsdom
/**
 * Render tests for the in-round screens after the avatar redesign: the DOM contract the e2e suite
 * relies on (secret absent while hidden, data-revealed, ballot-opt, vote-lock, results-*), the
 * avatars and moods each screen shows, the sound cues, and the Results opening sequence (skipped
 * under prefers-reduced-motion).
 */
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AVATAR_IDS } from '../../avatars';
import { createInitialState, reduce } from '../../game/engine';
import { GameProvider, useGameState } from '../../game/store';
import type { GameState, Lang } from '../../game/types';
import { NavProvider } from '../../nav';
import { CluesScreen } from '../../screens/CluesScreen';
import { DiscussionScreen } from '../../screens/DiscussionScreen';
import { GuessScreen } from '../../screens/GuessScreen';
import { ResultsScreen } from '../../screens/ResultsScreen';
import { RevealScreen } from '../../screens/RevealScreen';
import { VoteScreen } from '../../screens/VoteScreen';

const sfx = vi.hoisted(() => ({ play: vi.fn<(name: string) => void>(), haptic: vi.fn() }));
vi.mock('../../lib/sfx', () => ({
  playSfx: sfx.play,
  haptic: sfx.haptic,
  setSfxEnabled: () => {},
  isSfxEnabled: () => false,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no canvas: without this stub Confetti's getContext('2d') logs a "not implemented" error on
// every table win (the component already handles a null context).
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
});

interface Mounted {
  c: HTMLDivElement;
  state: () => GameState;
  unmount: () => void;
}
const mounted: Mounted[] = [];

function mount(ui: ReactNode, initialState: GameState): Mounted {
  let latest: GameState | null = null;
  function Probe() {
    latest = useGameState();
    return null;
  }
  const c = document.createElement('div');
  document.body.appendChild(c);
  const root: Root = createRoot(c);
  act(() => {
    root.render(
      <GameProvider initialState={initialState}>
        <NavProvider initial="game">
          <Probe />
          {ui}
        </NavProvider>
      </GameProvider>,
    );
  });
  const m: Mounted = {
    c,
    state: () => latest!,
    unmount: () => {
      act(() => root.unmount());
      c.remove();
    },
  };
  mounted.push(m);
  return m;
}

const q = (c: Element, sel: string) => c.querySelector(sel);
const qa = (c: Element, sel: string) => [...c.querySelectorAll(sel)];
const byId = (c: Element, id: string) => q(c, `[data-testid="${id}"]`);

function click(el: Element | null): void {
  if (!el) throw new Error('element not found');
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

function pointer(el: Element | null, type: 'pointerdown' | 'pointerup', pointerType = 'touch'): void {
  if (!el) throw new Error('element not found');
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(ev, {
    pointerId: { value: 7 },
    pointerType: { value: pointerType },
    button: { value: 0 },
    isPrimary: { value: true },
  });
  act(() => {
    el.dispatchEvent(ev);
  });
}

function tick(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

const NAMES = ['Dana', 'Yossi', 'Noa', 'Omri'];
const IMPOSTER = 'p2';

/** Four players (avatars = the first four of the cast), hold mode, a started round: Noa (p2) is the Imposter, Yossi starts. */
function startedRound(lang: Lang = 'en'): GameState {
  let s = createInitialState({ language: lang, revealMethod: 'hold' });
  NAMES.forEach((name, i) => {
    s = reduce(s, { type: 'ADD_PLAYER', id: `p${i}`, name, avatar: AVATAR_IDS[i] });
  });
  return reduce(s, {
    type: 'START_ROUND',
    word: { word: 'Pizza', category: 'food', difficulty: 1, aliases: [] },
    categoryId: 'food',
    categoryName: 'Food',
    imposterIds: [IMPOSTER],
    starterId: 'p1',
  });
}
function atClues(lang: Lang = 'en'): GameState {
  let s = startedRound(lang);
  for (let i = 0; i < NAMES.length; i++) s = reduce(s, { type: 'REVEAL_NEXT' });
  return s;
}
function atDiscussion(): GameState {
  let s = atClues();
  for (let i = 0; i < NAMES.length * s.round!.config.clueRounds; i++) s = reduce(s, { type: 'CLUE_NEXT' });
  return s;
}
function atVote(): GameState {
  return reduce(atDiscussion(), { type: 'DISCUSSION_DONE' });
}
function atGuess(): GameState {
  let s = atVote();
  for (const id of ['p0', 'p1', 'p2', 'p3']) {
    s = reduce(s, { type: 'CAST_VOTE', voterId: id, votedId: id === IMPOSTER ? 'p0' : IMPOSTER });
  }
  return s;
}
function atResults(guess: string): GameState {
  return reduce(atGuess(), { type: 'SUBMIT_GUESS', guess });
}

beforeEach(() => {
  vi.useFakeTimers();
  sfx.play.mockClear();
  sfx.haptic.mockClear();
});
afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount();
  vi.useRealTimers();
  localStorage.clear();
});

describe('Reveal', () => {
  it('pass-to shows the bobbing avatar with a whoosh and ticks, then a hidden black card', () => {
    const m = mount(<RevealScreen />, startedRound());
    const c = m.c;
    expect(byId(c, 'pass-screen')).not.toBeNull();
    expect(byId(c, 'pass-name')?.textContent).toBe('Dana');
    const big = q(c, '.pass__avatar [data-avatar]');
    expect(big?.getAttribute('data-avatar')).toBe(AVATAR_IDS[0]);
    expect(big?.classList.contains('avatar--bob')).toBe(true);
    expect(byId(c, 'pass-count')?.textContent).toBe('3');
    expect(sfx.play).toHaveBeenCalledWith('whoosh');
    expect(sfx.play).toHaveBeenCalledWith('tick');
    expect(byId(c, 'secret-card')).toBeNull();

    // Second by second (one task per interval tick, as in a browser) so every countdown value renders.
    for (let i = 0; i < 31; i++) tick(100);
    const card = byId(c, 'secret-card');
    expect(card?.getAttribute('data-revealed')).toBe('false');
    expect(byId(c, 'secret-word')).toBeNull();
    expect(byId(c, 'secret-imposter')).toBeNull();
    // The card's small avatar never tells the role while hidden.
    expect(q(c, '.secret-card__head [data-avatar]')?.getAttribute('data-mood')).toBe('idle');
    expect(sfx.play.mock.calls.filter(([n]) => n === 'tick')).toHaveLength(3);
    expect(byId(c, 'reveal-pass')).toBeNull();
  });

  it('hold shows the word with a happy avatar and the reveal cue; release hides it; pass advances', () => {
    const m = mount(<RevealScreen />, startedRound());
    const c = m.c;
    tick(3100);
    pointer(byId(c, 'hold-button'), 'pointerdown');
    expect(byId(c, 'secret-card')?.getAttribute('data-revealed')).toBe('true');
    expect(byId(c, 'secret-word')?.textContent).toBe('Pizza');
    expect(q(c, '.secret-card__head [data-avatar]')?.getAttribute('data-mood')).toBe('happy');
    expect(byId(c, 'hold-button')?.getAttribute('aria-pressed')).toBe('true');
    expect(sfx.play).toHaveBeenCalledWith('reveal');
    expect(sfx.haptic).toHaveBeenCalledWith('light');

    pointer(byId(c, 'hold-button'), 'pointerup');
    expect(byId(c, 'secret-card')?.getAttribute('data-revealed')).toBe('false');
    expect(byId(c, 'secret-word')).toBeNull();
    expect(q(c, '.secret-card__head [data-avatar]')?.getAttribute('data-mood')).toBe('idle');

    tick(1100);
    expect(byId(c, 'reveal-pass')).not.toBeNull();
    click(byId(c, 'reveal-pass'));
    expect(m.state().round?.revealIndex).toBe(1);
    expect(byId(c, 'pass-name')?.textContent).toBe('Yossi');
  });

  it('the IMPOSTER card shows the avatar sneaky behind its mask with a red glow, only while revealed', () => {
    let s = startedRound();
    s = reduce(s, { type: 'REVEAL_NEXT' });
    s = reduce(s, { type: 'REVEAL_NEXT' });
    const m = mount(<RevealScreen />, s);
    const c = m.c;
    expect(byId(c, 'pass-name')?.textContent).toBe('Noa');
    tick(3100);
    const card = byId(c, 'secret-card') as HTMLElement;
    expect(card.style.getPropertyValue('--glow-color')).toBe('');
    pointer(byId(c, 'hold-button'), 'pointerdown');
    expect(byId(c, 'secret-imposter')).not.toBeNull();
    expect(byId(c, 'secret-card')?.textContent).toContain('Food');
    const face = q(c, '.secret-card__head [data-avatar]');
    expect(face?.getAttribute('data-mood')).toBe('sneaky');
    expect(face?.getAttribute('data-unmasked')).toBe('false');
    expect(card.style.getPropertyValue('--glow-color')).toBe('var(--danger)');
    pointer(byId(c, 'hold-button'), 'pointerup');
    expect(byId(c, 'secret-imposter')).toBeNull();
    expect(face?.getAttribute('data-mood')).toBe('idle');
    expect(card.style.getPropertyValue('--glow-color')).toBe('');
  });

  it('renders in Hebrew with the name isolated in the pass label', () => {
    const m = mount(<RevealScreen />, startedRound('he'));
    const pass = byId(m.c, 'pass-screen');
    expect(pass?.getAttribute('aria-label')).toContain('⁨Dana⁩');
    expect(pass?.textContent).toMatch(/[א-ת]/);
  });
});

describe('Clues', () => {
  it('shows the speaker large with the hint bubble, the seats row and the round chip', () => {
    const m = mount(<CluesScreen />, atClues());
    const c = m.c;
    expect(byId(c, 'clues-round')?.textContent).toContain('1');
    expect(byId(c, 'clues-speaker')?.textContent).toBe('Yossi');
    const big = q(c, '.clues__avatar [data-avatar]');
    expect(big?.getAttribute('data-avatar')).toBe(AVATAR_IDS[1]);
    expect(q(c, '.bubble')?.textContent).toContain('clue');
    expect(q(c, '.bubble__dots')).toBeNull();
    const seats = qa(c, '.turn-seat');
    expect(seats).toHaveLength(4);
    expect(seats[0].classList.contains('is-current')).toBe(true);
    expect(seats[0].querySelector('[data-avatar]')?.getAttribute('data-avatar')).toBe(AVATAR_IDS[1]);
    expect(seats[3].querySelector('[data-avatar]')?.getAttribute('data-avatar')).toBe(AVATAR_IDS[0]);

    tick(500);
    click(byId(c, 'clues-next'));
    expect(m.state().round?.clueTurn).toBe(1);
    expect(byId(c, 'clues-speaker')?.textContent).toBe('Noa');
    expect(q(c, '.bubble__dots')).not.toBeNull();
    expect(qa(c, '.turn-seat')[0].classList.contains('is-done')).toBe(true);
    expect(qa(c, '.turn-seat')[1].classList.contains('is-current')).toBe(true);
  });
});

describe('Discussion', () => {
  it('seats every avatar thinking around the clock; the ring pulses through the last 10 s', () => {
    const m = mount(<DiscussionScreen />, atDiscussion());
    const c = m.c;
    const seats = qa(c, '.avatar-ring__seat [data-avatar]');
    expect(seats).toHaveLength(4);
    for (const s of seats) expect(s.getAttribute('data-mood')).toBe('think');
    expect(byId(c, 'discussion-clock')?.textContent).toBe('1:00');
    expect(q(c, '.discussion__ring')?.classList.contains('anim-pulse')).toBe(false);
    expect(m.state().round?.discussionEndsAt).not.toBeNull();

    tick(51_000);
    expect(q(c, '.discussion__ring')?.classList.contains('anim-pulse')).toBe(true);
    tick(10_000);
    expect(q(c, '.discussion__ring')?.classList.contains('is-done')).toBe(true);
    for (const s of qa(c, '.avatar-ring__seat [data-avatar]')) expect(s.getAttribute('data-mood')).toBe('shocked');
    click(byId(c, 'discussion-vote'));
    expect(m.state().phase).toBe('vote');
  });
});

describe('Vote', () => {
  it('ballot options carry avatars; a tap checks one with a pop; lock casts the vote', () => {
    const m = mount(<VoteScreen />, atVote());
    const c = m.c;
    expect(byId(c, 'pass-name')?.textContent).toBe('Dana');
    tick(3100);
    expect(byId(c, 'vote-ballot')).toBeNull();
    pointer(byId(c, 'hold-button'), 'pointerdown');
    expect(byId(c, 'vote-ballot')).not.toBeNull();
    const opts = qa(c, '[data-testid="ballot-opt"]');
    expect(opts).toHaveLength(3);
    expect(opts.map((o) => o.getAttribute('data-player-id'))).toEqual(['p1', 'p2', 'p3']);
    for (const o of opts) expect(o.querySelector('[data-avatar]')).not.toBeNull();
    expect(byId(c, 'vote-lock')).toBeNull();

    sfx.play.mockClear();
    click(opts[1]);
    expect(opts[1].getAttribute('aria-checked')).toBe('true');
    expect(opts[1].querySelector('[data-avatar]')?.getAttribute('data-mood')).toBe('shocked');
    expect(sfx.play).toHaveBeenCalledWith('pop');
    click(opts[1]); // same choice again: no second pop
    expect(sfx.play.mock.calls.filter(([n]) => n === 'pop')).toHaveLength(1);

    pointer(byId(c, 'hold-button'), 'pointerup');
    expect(byId(c, 'vote-ballot')).toBeNull();
    tick(500);
    click(byId(c, 'vote-lock'));
    expect(m.state().round?.votes.p0).toBe('p2');
    expect(byId(c, 'pass-name')?.textContent).toBe('Yossi');
  });
});

describe('Guess', () => {
  it('shows the caught player shocked with the category, input and give-up', () => {
    const m = mount(<GuessScreen />, atGuess());
    const c = m.c;
    expect(byId(c, 'guess-screen')?.textContent).toContain('Noa');
    const face = q(c, '.guess__avatar [data-avatar]');
    expect(face?.getAttribute('data-avatar')).toBe(AVATAR_IDS[2]);
    expect(face?.getAttribute('data-mood')).toBe('shocked');
    expect(byId(c, 'guess-category')?.textContent).toContain('Food');
    expect(byId(c, 'guess-input')).not.toBeNull();
    expect((byId(c, 'guess-submit') as HTMLButtonElement).disabled).toBe(true);
    click(byId(c, 'guess-giveup'));
    expect(m.state().phase).toBe('results');
  });
});

describe('Results', () => {
  it('table win: drumroll, banner + unmask, then tada with confetti and a happy jumping table', () => {
    const m = mount(<ResultsScreen />, atResults('nope'));
    const c = m.c;
    const banner = byId(c, 'results-banner')!;
    expect(banner.getAttribute('data-winner')).toBe('table');
    expect(banner.classList.contains('is-waiting')).toBe(true);
    expect(byId(c, 'results-winner')?.textContent).toContain('The table wins!');
    expect(byId(c, 'results-word')?.textContent).toBe('Pizza');
    expect(q(c, '.results__imposters')?.textContent).toContain('Noa');
    expect(byId(c, 'results-next')).not.toBeNull();
    const imp = q(c, '.results__spotlight [data-avatar]')!;
    expect(imp.getAttribute('data-avatar')).toBe(AVATAR_IDS[2]);
    expect(imp.getAttribute('data-unmasked')).toBe('false');
    expect(sfx.play).toHaveBeenCalledWith('drumroll');
    expect(sfx.play).not.toHaveBeenCalledWith('tada');

    tick(600);
    expect(banner.classList.contains('anim-bounce-in')).toBe(true);
    expect(imp.getAttribute('data-unmasked')).toBe('true');
    expect(sfx.play).toHaveBeenCalledWith('unmask');
    expect(q(c, '.results__sticker')).not.toBeNull();

    tick(700);
    expect(byId(c, 'results-screen')?.getAttribute('data-stage')).toBe('2');
    expect(sfx.play).toHaveBeenCalledWith('tada');
    expect(sfx.play).not.toHaveBeenCalledWith('womp');
    expect(byId(c, 'confetti')).not.toBeNull();
    const table = qa(c, '.results__table [data-avatar]');
    expect(table).toHaveLength(3);
    for (const a of table) {
      expect(a.getAttribute('data-mood')).toBe('happy');
      expect(a.classList.contains('avatar--jump')).toBe(true);
    }
    expect(imp.getAttribute('data-mood')).toBe('sad');

    // Tally with avatars, scoreboard with avatars and crowned leaders.
    expect(qa(c, '.tally__row [data-avatar]')).toHaveLength(2);
    const board = byId(c, 'results-scoreboard')!;
    expect(qa(board, '.scoreboard__row [data-avatar]')).toHaveLength(4);
    expect(qa(board, '.crown')).toHaveLength(3);
    expect(board.textContent).toContain('+1');
    for (const n of NAMES) expect(board.textContent).toContain(n);

    click(byId(c, 'results-next'));
    expect(m.state().phase).toBe('reveal');
  });

  it('imposter win: womp, a sneaky wiggling Imposter and a sad wobbling table', () => {
    const m = mount(<ResultsScreen />, atResults('pizza'));
    const c = m.c;
    expect(byId(c, 'results-banner')?.getAttribute('data-winner')).toBe('imposter');
    expect(byId(c, 'results-winner')?.textContent).toContain('The Imposter wins!');
    tick(1300);
    expect(sfx.play).toHaveBeenCalledWith('womp');
    expect(sfx.play).not.toHaveBeenCalledWith('tada');
    expect(byId(c, 'confetti')?.getAttribute('data-state')).toBe('idle'); // mounted, never fired
    const imp = q(c, '.results__spotlight [data-avatar]')!;
    expect(imp.getAttribute('data-mood')).toBe('sneaky');
    expect(imp.classList.contains('avatar--wiggle')).toBe(true);
    for (const seat of qa(c, '.results__seat')) {
      expect(seat.classList.contains('anim-wobble')).toBe(true);
      expect(seat.querySelector('[data-avatar]')?.getAttribute('data-mood')).toBe('sad');
    }
    expect(byId(c, 'results-scoreboard')?.textContent).toContain('+2');
  });

  it('skips the sequence under prefers-reduced-motion (no drumroll, the outcome at once)', () => {
    const original = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (media: string) => ({ matches: true, media, addEventListener() {}, removeEventListener() {} }),
    });
    try {
      const m = mount(<ResultsScreen />, atResults('nope'));
      const c = m.c;
      expect(byId(c, 'results-screen')?.getAttribute('data-stage')).toBe('2');
      expect(byId(c, 'results-banner')?.classList.contains('is-waiting')).toBe(false);
      expect(q(c, '.results__spotlight [data-avatar]')?.getAttribute('data-unmasked')).toBe('true');
      expect(sfx.play).not.toHaveBeenCalledWith('drumroll');
      expect(sfx.play).not.toHaveBeenCalledWith('unmask');
      expect(sfx.play).toHaveBeenCalledWith('tada');
    } finally {
      Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: original });
    }
  });

  it('renders the Hebrew results with the Imposter name isolated', () => {
    let s = startedRound('he');
    for (let i = 0; i < 4; i++) s = reduce(s, { type: 'REVEAL_NEXT' });
    for (let i = 0; i < 8; i++) s = reduce(s, { type: 'CLUE_NEXT' });
    s = reduce(s, { type: 'DISCUSSION_DONE' });
    for (const id of ['p0', 'p1', 'p2', 'p3']) s = reduce(s, { type: 'CAST_VOTE', voterId: id, votedId: id === IMPOSTER ? 'p0' : IMPOSTER });
    s = reduce(s, { type: 'SUBMIT_GUESS', guess: '' });
    const m = mount(<ResultsScreen />, s);
    expect(byId(m.c, 'results-winner')?.textContent).toMatch(/[א-ת]/);
    expect(q(m.c, '.results__imposters')?.textContent).toContain('⁨Noa⁩');
  });
});

describe('GameMenu', () => {
  it('opens a bottom sheet with Home / Quit round / End game', () => {
    const m = mount(<CluesScreen />, atClues());
    const c = m.c;
    expect(q(c, '.sheet')).toBeNull();
    click(byId(c, 'game-menu'));
    expect(q(c, '.sheet')).not.toBeNull();
    expect(byId(c, 'game-menu-home')).not.toBeNull();
    expect(byId(c, 'game-menu-quit')).not.toBeNull();
    expect(byId(c, 'game-menu-end')).not.toBeNull();
  });
});
