/**
 * Character registry. Characters live in ./characters/<id>.tsx and export `character: Character`
 * (see core.ts). They are collected with import.meta.glob, so adding a file registers it; ids without
 * a file render a generic placeholder person in their signature colour, so the app works while the
 * cast is still being drawn in parallel.
 */
import { AVATAR_COLORS, AVATAR_IDS, isAvatarId, type AvatarId, type Character, type FaceProps } from './core';
import { Person } from './parts';

interface CharacterModule {
  character?: Character;
  default?: Character;
}

const modules = import.meta.glob<CharacterModule>(['./characters/*.tsx', '!./characters/*.test.tsx'], { eager: true });

const REGISTERED: Partial<Record<AvatarId, Character>> = {};
for (const mod of Object.values(modules)) {
  const ch = mod.character ?? mod.default;
  if (ch && isAvatarId(ch.id) && typeof ch.Face === 'function') REGISTERED[ch.id] = ch;
}

function placeholder(id: AvatarId): Character {
  const color = AVATAR_COLORS[id];
  const Face = ({ mood }: FaceProps) => (
    <Person mood={mood} skin="light" shirt={color} hair={{ variant: 'short', color: '#4A2C1A' }} mask={{ color }} />
  );
  return { id, color, look: { skin: 'light', hair: 'short', headwear: 'none' }, Face };
}

/** Every id resolves to a character: the real one when its file exists, else a placeholder. */
export const CAST: Record<AvatarId, Character> = Object.fromEntries(
  AVATAR_IDS.map((id) => [id, REGISTERED[id] ?? placeholder(id)]),
) as Record<AvatarId, Character>;

/** True when the id renders a real character (its file has landed), not the placeholder. */
export function isRegistered(id: AvatarId): boolean {
  return REGISTERED[id] !== undefined;
}
