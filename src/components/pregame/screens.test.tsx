// @vitest-environment jsdom
/**
 * Render smoke tests for the pre-game screens after the avatar redesign: every screen mounts in both
 * languages, the illustrations carry real avatars, the player rows expose their avatar, the picker
 * lists the whole cast with taken ones marked and swaps through SET_AVATAR, and the Settings screen
 * drives settings.sounds.
 */
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { AVATAR_IDS } from '../../avatars';
import { createInitialState, reduce } from '../../game/engine';
import { GameProvider, useGameState } from '../../game/store';
import type { GameState, Lang } from '../../game/types';
import { NavProvider, type Screen } from '../../nav';
import { HomeScreen } from '../../screens/HomeScreen';
import { HowToScreen } from '../../screens/HowToScreen';
import { SettingsScreen } from '../../screens/SettingsScreen';
import { SetupScreen } from '../../screens/SetupScreen';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface Mounted {
  container: HTMLDivElement;
  state: () => GameState;
  unmount: () => void;
}

const mounted: Mounted[] = [];

function mount(ui: ReactNode, initialState: GameState, screen: Screen): Mounted {
  let latest: GameState | null = null;
  function Probe() {
    latest = useGameState();
    return null;
  }
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <GameProvider initialState={initialState}>
        <NavProvider initial={screen}>
          <Probe />
          {ui}
        </NavProvider>
      </GameProvider>,
    );
  });
  const m: Mounted = {
    container,
    state: () => latest!,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
  mounted.push(m);
  return m;
}

function click(el: Element | null): void {
  if (!el) throw new Error('element not found');
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

function withPlayers(lang: Lang = 'en'): GameState {
  let s = createInitialState({ language: lang });
  const names = ['Dana', 'Yossi', 'Noa', 'Omri'];
  names.forEach((name, i) => {
    s = reduce(s, { type: 'ADD_PLAYER', id: `p${i}`, name, avatar: AVATAR_IDS[i] });
  });
  return s;
}

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount();
  localStorage.clear();
});

describe('Home', () => {
  it('renders the logo, a five-avatar hero and the Play / How to play actions', () => {
    const m = mount(<HomeScreen />, createInitialState({ language: 'en' }), 'home');
    const c = m.container;
    expect(c.querySelector('[data-testid="home-screen"]')).not.toBeNull();
    expect(c.querySelector('.logo__name')?.textContent).toBe('Imposter');
    expect(c.querySelectorAll('.hero [data-avatar]')).toHaveLength(5);
    expect(c.querySelector('[data-testid="home-play"]')).not.toBeNull();
    expect(c.querySelector('[data-testid="home-howto"]')).not.toBeNull();
    expect(c.querySelector('[data-testid="lang-he"]')).not.toBeNull();
  });

  it('shows the Hebrew wordmark and the group as avatar chips', () => {
    const m = mount(<HomeScreen />, withPlayers('he'), 'home');
    const c = m.container;
    expect(c.querySelector('.logo__name')?.textContent).toBe('מתחזה');
    const chips = c.querySelectorAll('.home__players .chip--avatar');
    expect(chips).toHaveLength(4);
    expect(chips[0].querySelector('[data-avatar]')?.getAttribute('data-avatar')).toBe(AVATAR_IDS[0]);
    // The hero uses the group's own characters, filled up to five from the house cast.
    const heroIds = [...c.querySelectorAll('.hero [data-avatar]')].map((el) => el.getAttribute('data-avatar'));
    expect(heroIds).toHaveLength(5);
    for (const id of AVATAR_IDS.slice(0, 4)) expect(heroIds).toContain(id);
  });
});

describe('How to play', () => {
  it('has six illustrated steps, a scoring box and the lift illustration with an avatar', () => {
    const m = mount(<HowToScreen />, createInitialState({ language: 'en' }), 'howto');
    const c = m.container;
    const steps = c.querySelectorAll('.howto__step');
    expect(steps).toHaveLength(6);
    for (const step of steps) {
      expect(step.querySelector('.howto__art')).not.toBeNull();
      expect(step.querySelectorAll('[data-avatar]').length).toBeGreaterThan(0);
      expect(step.querySelector('.howto__text')?.textContent?.length).toBeGreaterThan(10);
    }
    // Step 6 shows an unmasked Imposter (mounted bare: no mask in the DOM).
    const caught = steps[5].querySelector('[data-avatar]');
    expect(caught?.getAttribute('data-unmasked')).toBe('true');
    expect(caught?.querySelector('[data-part="mask"]')).toBeNull();
    expect(c.querySelectorAll('.howto__scoreRow')).toHaveLength(3);
    expect(c.querySelector('.howto__score')?.textContent).toContain('+1');
    expect(c.querySelector('.howto__score')?.textContent).toContain('+3');
    expect(c.querySelector('.lift-illus [data-avatar]')).not.toBeNull();
    expect(c.querySelector('[data-testid="howto-done"]')).not.toBeNull();
  });

  it('is fully Hebrew in Hebrew', () => {
    const m = mount(<HowToScreen />, createInitialState({ language: 'he' }), 'howto');
    const text = m.container.querySelector('[data-testid="howto-screen"]')?.textContent ?? '';
    expect(text).toMatch(/[א-ת]/);
    expect(text).not.toMatch(/Names and category|Scoring/);
  });
});

describe('Setup', () => {
  it('shows each player with their avatar and opens the picker on tap', () => {
    const m = mount(<SetupScreen />, withPlayers(), 'setup');
    const c = m.container;
    const avatars = c.querySelectorAll<HTMLButtonElement>('[data-testid="player-avatar"]');
    expect(avatars).toHaveLength(4);
    expect(avatars[0].getAttribute('data-avatar')).toBe('bean');
    expect(avatars[0].querySelector('[data-avatar="bean"]')).not.toBeNull();
    expect(c.querySelectorAll('.prow__name')).toHaveLength(4);
    expect(c.querySelector('[data-testid="avatar-picker"]')).toBeNull();

    click(avatars[1]);
    const picker = c.querySelector('[data-testid="avatar-picker"]');
    expect(picker).not.toBeNull();
    expect(picker?.textContent).toContain('Yossi');
    const opts = c.querySelectorAll<HTMLButtonElement>('[data-testid="avatar-opt"]');
    expect(opts).toHaveLength(AVATAR_IDS.length);
    expect([...opts].map((o) => o.getAttribute('data-avatar'))).toEqual([...AVATAR_IDS]);
    // Yossi's own (bolt) is checked; bean, bubble and cloud are taken by the others, the rest free.
    const byId = (id: string) => c.querySelector<HTMLButtonElement>(`[data-testid="avatar-opt"][data-avatar="${id}"]`)!;
    expect(byId('bolt').getAttribute('aria-checked')).toBe('true');
    expect(byId('bean').getAttribute('data-taken')).toBe('true');
    expect(byId('bean').getAttribute('aria-label')).toContain('Dana');
    expect(byId('fig').getAttribute('data-taken')).toBeNull();
  });

  it('picking a free character dispatches SET_AVATAR and closes; picking a taken one swaps', () => {
    const m = mount(<SetupScreen />, withPlayers(), 'setup');
    const c = m.container;
    const avatarBtn = (i: number) => c.querySelectorAll<HTMLButtonElement>('[data-testid="player-avatar"]')[i];
    const opt = (id: string) => c.querySelector<HTMLButtonElement>(`[data-testid="avatar-opt"][data-avatar="${id}"]`);

    click(avatarBtn(1));
    click(opt('kiwi'));
    expect(c.querySelector('[data-testid="avatar-picker"]')).toBeNull();
    expect(m.state().players[1].avatar).toBe('kiwi');
    expect(avatarBtn(1).getAttribute('data-avatar')).toBe('kiwi');

    click(avatarBtn(0));
    click(opt('kiwi'));
    expect(m.state().players[0].avatar).toBe('kiwi');
    expect(m.state().players[1].avatar).toBe('bean');
  });

  it('closes the picker with Escape and keeps the Start / add controls', () => {
    const m = mount(<SetupScreen />, withPlayers(), 'setup');
    const c = m.container;
    click(c.querySelector('[data-testid="player-avatar"]'));
    expect(c.querySelector('[data-testid="avatar-picker"]')).not.toBeNull();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(c.querySelector('[data-testid="avatar-picker"]')).toBeNull();
    expect(c.querySelector('[data-testid="setup-start"]')).not.toBeNull();
    expect(c.querySelector('[data-testid="setup-name-input"]')).not.toBeNull();
    expect(c.querySelector('[data-testid="setup-add"]')).not.toBeNull();
    expect(c.querySelector('[data-testid="setup-settings"]')).not.toBeNull();
  });

  it('shows the empty state with avatars when there are no players', () => {
    const m = mount(<SetupScreen />, createInitialState({ language: 'he' }), 'setup');
    expect(m.container.querySelectorAll('.setup__empty [data-avatar]')).toHaveLength(2);
    expect(m.container.querySelector('.setup__emptyText')?.textContent).toMatch(/[א-ת]/);
  });
});

describe('Settings', () => {
  it('keeps the test ids and adds the Sound effects switch wired to settings.sounds', () => {
    const m = mount(<SettingsScreen />, createInitialState({ language: 'en' }), 'settings');
    const c = m.container;
    for (const id of [
      'settings-imposters-1',
      'settings-clue-rounds-1',
      'settings-discussion-0',
      'settings-reveal-hold',
      'settings-reveal-lift',
      'settings-difficulty-easy',
      'settings-lang-he',
      'settings-wordlang-he',
      'settings-penalty-off',
      'settings-back',
      'settings-back-top',
    ]) {
      expect(c.querySelector(`[data-testid="${id}"]`), id).not.toBeNull();
    }
    expect(m.state().settings.sounds).toBe(false);
    const group = c.querySelector('[role="radiogroup"][aria-label="Sound effects"]');
    expect(group).not.toBeNull();
    const on = [...group!.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find((b) => b.textContent === 'On');
    click(on!);
    expect(m.state().settings.sounds).toBe(true);
    expect(group?.getAttribute('data-value')).toBe('on');
    expect(c.querySelectorAll('.settings__group')).toHaveLength(3);
  });

  it('renders the Hebrew rows', () => {
    const m = mount(<SettingsScreen />, createInitialState({ language: 'he' }), 'settings');
    expect(m.container.querySelector('[role="radiogroup"][aria-label="אפקטים קוליים"]')).not.toBeNull();
    expect(m.container.textContent).toContain('חוקי הסיבוב');
  });
});
