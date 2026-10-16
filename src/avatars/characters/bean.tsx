/** Bean: light skin, dark curls under a green beanie with a sprout leaf, freckles. Mask: pink-red. */
import { AVATAR_COLORS, type Character, type FaceProps } from '../core';
import { INK, Person } from '../parts';

const SPROUT = '#3EC9A0';

function Face({ mood }: FaceProps) {
  return (
    <Person
      mood={mood}
      skin="light"
      head="round"
      shirt="#FFE08A"
      hair={{ variant: 'curls', color: '#4A2C1A' }}
      headwear={{ variant: 'beanie', color: SPROUT, accent: '#FFE08A' }}
      mask={{ color: AVATAR_COLORS.bean }}
      accessories={[{ kind: 'freckles' }]}
      front={
        /* A little leaf tucked into the brim: beans sprout. */
        <g data-part="custom" data-kind="leaf">
          <path d="M84 31 C85 23, 93 20, 98 24 C96 31, 90 34, 84 31 Z" fill="#8BE35A" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M86 30 L94 25" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        </g>
      }
    />
  );
}

export const character: Character = {
  id: 'bean',
  color: AVATAR_COLORS.bean,
  look: { skin: 'light', hair: 'curls', headwear: 'beanie' },
  Face,
};
