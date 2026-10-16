/**
 * Player avatars: a cast of cute, rounded, masked cartoon people drawn as inline SVG.
 *
 * CONTRACT (the art builders implement the characters; screens only use this API):
 *  - AVATAR_IDS: the twelve character ids, in picker order.
 *  - AVATARS[id]: { id, color } — `color` is the character's signature (mask) colour, usable as an accent.
 *  - <Avatar id size mood animate unmasked /> renders one character at `size` px (square).
 *      mood: 'idle' (default, blinks now and then) | 'happy' | 'shocked' | 'sneaky' | 'sad' | 'think'
 *      animate: 'none' (default) | 'bob' (gentle idle float) | 'wiggle' | 'jump' | 'shake'
 *      unmasked: true plays the mask-off reveal (the mask slides down and drops), used on Results.
 *  - Everything is vector, offline and theme-safe; no external assets.
 *
 * PLACEHOLDER: until the characters land this draws a coloured circle with an eye-mask.
 */
import type { CSSProperties } from 'react';

export const AVATAR_IDS = [
  'bean',
  'bolt',
  'bubble',
  'cloud',
  'dot',
  'echo',
  'fig',
  'glow',
  'hoop',
  'ivy',
  'jet',
  'kiwi',
] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];

export type AvatarMood = 'idle' | 'happy' | 'shocked' | 'sneaky' | 'sad' | 'think';
export type AvatarAnimation = 'none' | 'bob' | 'wiggle' | 'jump' | 'shake';

export interface AvatarMeta {
  id: AvatarId;
  /** Signature colour (the mask), as a CSS colour. */
  color: string;
}

export const AVATARS: Record<AvatarId, AvatarMeta> = {
  bean: { id: 'bean', color: '#FF5C7A' },
  bolt: { id: 'bolt', color: '#FFC857' },
  bubble: { id: 'bubble', color: '#7CD6FF' },
  cloud: { id: 'cloud', color: '#C9B6FF' },
  dot: { id: 'dot', color: '#5EE6A8' },
  echo: { id: 'echo', color: '#FF9F6B' },
  fig: { id: 'fig', color: '#B678FF' },
  glow: { id: 'glow', color: '#FFE66D' },
  hoop: { id: 'hoop', color: '#4FD1C5' },
  ivy: { id: 'ivy', color: '#8BE35A' },
  jet: { id: 'jet', color: '#6B8CFF' },
  kiwi: { id: 'kiwi', color: '#FF7EB6' },
};

export function isAvatarId(x: unknown): x is AvatarId {
  return typeof x === 'string' && (AVATAR_IDS as readonly string[]).includes(x);
}

export interface AvatarProps {
  id: string | undefined;
  size?: number;
  mood?: AvatarMood;
  animate?: AvatarAnimation;
  unmasked?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Accessible label; omit (default) for a purely decorative avatar next to the player's name. */
  label?: string;
}

export function Avatar({ id, size = 64, mood = 'idle', animate = 'none', unmasked = false, className = '', style, label }: AvatarProps) {
  const meta = isAvatarId(id) ? AVATARS[id] : AVATARS.bean;
  return (
    <svg
      className={`avatar avatar--${animate} avatar--${mood} ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-avatar={meta.id}
      data-mood={mood}
      data-unmasked={unmasked ? 'true' : 'false'}
    >
      <circle cx="60" cy="60" r="52" fill="#F1C7A3" stroke="#1B1F3B" strokeWidth="6" />
      {!unmasked && <rect x="22" y="44" width="76" height="26" rx="13" fill={meta.color} stroke="#1B1F3B" strokeWidth="5" />}
      <circle cx="44" cy="57" r="6" fill="#1B1F3B" />
      <circle cx="76" cy="57" r="6" fill="#1B1F3B" />
      <path d="M44 84 Q60 98 76 84" fill="none" stroke="#1B1F3B" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
