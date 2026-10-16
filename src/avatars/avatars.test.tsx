// @vitest-environment jsdom
/**
 * Avatar system: every id renders, root data attributes, the mask's DOM presence across the
 * masked -> unmasked transition, moods changing the face, and the cast rules (colours, unique
 * hair + headwear, skin tones).
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AVATAR_IDS, AVATARS, Avatar, isAvatarId, type AvatarMood, type AvatarProps } from './index';
import { AVATAR_COLORS, AVATAR_MOODS, MASK_DROP_MS, type SkinTone } from './core';
import { CAST, isRegistered } from './registry';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface Mounted {
  container: HTMLDivElement;
  root: Root;
  render: (props: AvatarProps) => void;
  svg: () => SVGSVGElement;
  unmount: () => void;
}

const mounted: Mounted[] = [];

function mount(props: AvatarProps): Mounted {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const m: Mounted = {
    container,
    root,
    render: (p) => act(() => root.render(<Avatar {...p} />)),
    svg: () => container.querySelector('svg') as SVGSVGElement,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
  m.render(props);
  mounted.push(m);
  return m;
}

const mask = (m: Mounted) => m.container.querySelector('[data-part="mask"]');
const faceMarkup = (m: Mounted) => m.container.querySelector('[data-part="face"]')!.innerHTML;

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount();
  vi.useRealTimers();
});

describe('Avatar', () => {
  it('renders every id with data-avatar / data-mood / data-unmasked on the root svg', () => {
    for (const id of AVATAR_IDS) {
      const m = mount({ id, size: 40 });
      const svg = m.svg();
      expect(svg).toBeTruthy();
      expect(svg.getAttribute('data-avatar')).toBe(id);
      expect(svg.getAttribute('data-mood')).toBe('idle');
      expect(svg.getAttribute('data-unmasked')).toBe('false');
      expect(svg.getAttribute('viewBox')).toBe('0 0 120 120');
      expect(svg.getAttribute('width')).toBe('40');
      expect(svg.classList.contains('avatar')).toBe(true);
      expect(svg.classList.contains('avatar--none')).toBe(true);
      // Base anatomy is always there.
      for (const part of ['shadow', 'body', 'head', 'eyes', 'brows', 'mouth', 'mask']) {
        expect(m.container.querySelector(`[data-part="${part}"]`), `${id} ${part}`).toBeTruthy();
      }
    }
  });

  it('renders every mood for every id, each with distinct face markup', () => {
    for (const id of AVATAR_IDS) {
      const seen = new Map<string, AvatarMood>();
      for (const mood of AVATAR_MOODS) {
        const m = mount({ id, mood });
        expect(m.svg().getAttribute('data-mood')).toBe(mood);
        expect(m.svg().classList.contains(`avatar--${mood}`)).toBe(true);
        const html = faceMarkup(m);
        expect(seen.has(html), `${id}: ${mood} looks like ${seen.get(html)}`).toBe(false);
        seen.set(html, mood);
      }
    }
  });

  it('only idle has blink lids; moods change eyes, brows and mouth', () => {
    const idle = mount({ id: 'bean', mood: 'idle' });
    expect(idle.container.querySelectorAll('.av-lid')).toHaveLength(2);
    const happy = mount({ id: 'bean', mood: 'happy' });
    expect(happy.container.querySelectorAll('.av-lid')).toHaveLength(0);
    for (const part of ['eyes', 'brows', 'mouth']) {
      expect(happy.container.querySelector(`[data-part="${part}"]`)!.getAttribute('data-mood')).toBe('happy');
    }
  });

  it('falls back to bean for unknown ids and applies animate / className / style / label', () => {
    const m = mount({ id: 'nope', animate: 'bob', className: 'x', style: { opacity: 0.5 }, label: 'Dana' });
    const svg = m.svg();
    expect(svg.getAttribute('data-avatar')).toBe('bean');
    expect(svg.classList.contains('avatar--bob')).toBe(true);
    expect(svg.classList.contains('x')).toBe(true);
    expect(svg.style.opacity).toBe('0.5');
    expect(svg.style.getPropertyValue('--av-blink-delay')).toMatch(/^-\d+(\.\d+)?s$/);
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Dana');
    expect(svg.getAttribute('aria-hidden')).toBeNull();
    const plain = mount({ id: undefined });
    expect(plain.svg().getAttribute('aria-hidden')).toBe('true');
    expect(plain.svg().getAttribute('role')).toBeNull();
  });

  it('keeps the mask in the DOM while masked and never shows it when mounted unmasked', () => {
    const on = mount({ id: 'bolt' });
    expect(mask(on)).toBeTruthy();
    expect(mask(on)!.classList.contains('av-mask--off')).toBe(false);
    const off = mount({ id: 'bolt', unmasked: true });
    expect(off.svg().getAttribute('data-unmasked')).toBe('true');
    expect(mask(off)).toBeNull();
  });

  it('plays the mask-off only on the false -> true transition, then drops the mask from the DOM', () => {
    vi.useFakeTimers();
    const m = mount({ id: 'dot' });
    expect(mask(m)).toBeTruthy();
    m.render({ id: 'dot', unmasked: true });
    const dropping = mask(m);
    expect(dropping, 'mask stays for the animation').toBeTruthy();
    expect(dropping!.classList.contains('av-mask--off')).toBe(true);
    expect(m.svg().getAttribute('data-unmasked')).toBe('true');
    act(() => {
      vi.advanceTimersByTime(MASK_DROP_MS + 200);
    });
    expect(mask(m)).toBeNull();
    // Back on: the mask returns without the drop class.
    m.render({ id: 'dot', unmasked: false });
    expect(mask(m)).toBeTruthy();
    expect(mask(m)!.classList.contains('av-mask--off')).toBe(false);
  });

  it('shows the caught (shocked) face while unmasked unless a mood is given', () => {
    const caught = mount({ id: 'echo', unmasked: true });
    expect(caught.svg().getAttribute('data-mood')).toBe('idle');
    expect(caught.container.querySelector('[data-part="face"]')!.getAttribute('data-face-mood')).toBe('shocked');
    const happy = mount({ id: 'echo', unmasked: true, mood: 'happy' });
    expect(happy.container.querySelector('[data-part="face"]')!.getAttribute('data-face-mood')).toBe('happy');
  });

  it('keeps the exported API', () => {
    expect(AVATAR_IDS).toHaveLength(12);
    expect(isAvatarId('bean')).toBe(true);
    expect(isAvatarId('Bean')).toBe(false);
    for (const id of AVATAR_IDS) {
      expect(AVATARS[id]).toEqual({ id, color: AVATAR_COLORS[id] });
      expect(AVATARS[id].color).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});

describe('cast', () => {
  const OWNED = ['bean', 'bolt', 'bubble', 'cloud', 'dot', 'echo'] as const;

  it('registers the first six characters (not placeholders)', () => {
    for (const id of OWNED) {
      expect(isRegistered(id), id).toBe(true);
      const m = mount({ id });
      expect(m.svg().getAttribute('data-placeholder')).toBeNull();
      expect(m.container.querySelector('[data-part="custom"]'), `${id} has a custom touch`).toBeTruthy();
    }
  });

  it('marks ids whose file has not landed as placeholders, which still render fully', () => {
    for (const id of AVATAR_IDS) {
      if (isRegistered(id)) continue;
      const m = mount({ id });
      expect(m.svg().getAttribute('data-placeholder')).toBe('true');
      expect(mask(m)).toBeTruthy();
    }
  });

  it('every registered character uses its signature colour and a unique hair + headwear combo', () => {
    const combos = new Map<string, string>();
    const skins = new Set<SkinTone>();
    for (const id of AVATAR_IDS) {
      const ch = CAST[id];
      expect(ch.id).toBe(id);
      expect(ch.color).toBe(AVATAR_COLORS[id]);
      if (!isRegistered(id)) continue;
      const key = `${ch.look.hair}+${ch.look.headwear}`;
      expect(combos.has(key), `${id} shares ${key} with ${combos.get(key)}`).toBe(false);
      combos.set(key, id);
      skins.add(ch.look.skin);
    }
    // Six tones across the cast; the first six characters already cover all of them.
    expect(skins.size).toBe(6);
  });
});
