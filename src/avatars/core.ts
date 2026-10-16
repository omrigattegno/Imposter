/**
 * Avatar core: ids, signature colours, mood/animation types and the Character registry contract.
 *
 * This module has no React rendering and no imports from ./index, so character files and parts can
 * import it without creating a cycle (index.tsx -> characters/*.tsx -> core.ts).
 *
 * Character files (src/avatars/characters/<id>.tsx) export:
 *   export const character: Character = { id: '<id>', color: AVATAR_COLORS['<id>'], look: {...}, Face };
 * index.tsx picks them up automatically (import.meta.glob); an id without a file gets a placeholder.
 */
import { createContext, type ComponentType } from 'react';

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

/** Signature (mask) colour per character; AVATARS[id].color in index.tsx is built from this. */
export const AVATAR_COLORS: Record<AvatarId, string> = {
  bean: '#FF5C7A',
  bolt: '#FFC857',
  bubble: '#7CD6FF',
  cloud: '#C9B6FF',
  dot: '#5EE6A8',
  echo: '#FF9F6B',
  fig: '#B678FF',
  glow: '#FFE66D',
  hoop: '#4FD1C5',
  ivy: '#8BE35A',
  jet: '#6B8CFF',
  kiwi: '#FF7EB6',
};

export type AvatarMood = 'idle' | 'happy' | 'shocked' | 'sneaky' | 'sad' | 'think';
export type AvatarAnimation = 'none' | 'bob' | 'wiggle' | 'jump' | 'shake';
export const AVATAR_MOODS: readonly AvatarMood[] = ['idle', 'happy', 'shocked', 'sneaky', 'sad', 'think'];

export type SkinTone = 'fair' | 'light' | 'tan' | 'medium' | 'brown' | 'deep';
export type HeadShape = 'round' | 'square' | 'tall';
export type HairVariant =
  | 'short'
  | 'curls'
  | 'bun'
  | 'bob'
  | 'braids'
  | 'mohawk'
  | 'waves'
  | 'long'
  | 'puff'
  | 'spiky'
  | 'pigtails';
export type HeadwearVariant = 'beanie' | 'cap' | 'flower' | 'headband' | 'headphones' | 'bandana' | 'bow' | 'crown';
export type AccessoryKind = 'freckles' | 'mole' | 'earring' | 'scarf' | 'bowtie' | 'bandaid';

/** Mask lifecycle, provided by <Avatar>: 'on' (in the DOM), 'dropping' (in the DOM, playing the mask-off), 'off' (not rendered). */
export type MaskState = 'on' | 'dropping' | 'off';
export const MaskStateContext = createContext<MaskState>('on');
/** How long the mask-off animation runs (avatars.css); the mask leaves the DOM shortly after. */
export const MASK_DROP_MS = 600;

export interface FaceProps {
  mood: AvatarMood;
}

/** What a character is made of; lets tests enforce "no two share hair + headwear" and the six skin tones. */
export interface CharacterLook {
  skin: SkinTone;
  hair: HairVariant | 'none';
  headwear: HeadwearVariant | 'none';
}

export interface Character {
  id: AvatarId;
  /** Must equal AVATAR_COLORS[id]. */
  color: string;
  look: CharacterLook;
  /** Renders the SVG groups for a 120x120 viewBox; the mask is placed via <Mask> and controlled by <Avatar>. */
  Face: ComponentType<FaceProps>;
}

export function isAvatarId(x: unknown): x is AvatarId {
  return typeof x === 'string' && (AVATAR_IDS as readonly string[]).includes(x);
}
