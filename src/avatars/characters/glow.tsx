/** Glow: fair skin, long hot-pink hair under a little gold crown, gold bowtie, sparkles in the air. Mask: lemon. */
import { AVATAR_COLORS, type Character, type FaceProps } from '../core';
import { INK, Person } from '../parts';

const LEMON = AVATAR_COLORS.glow;
const GOLD = '#FFC857';
const SPARKLE = 'M0 -6 C1 -2, 2 -1, 6 0 C2 1, 1 2, 0 6 C-1 2, -2 1, -6 0 C-2 -1, -1 -2, 0 -6 Z';

function Sparkle({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} data-kind="sparkle">
      <path d={SPARKLE} fill={LEMON} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}

function Face({ mood }: FaceProps) {
  return (
    <Person
      mood={mood}
      skin="fair"
      head="round"
      shirt="#7A5CFF"
      hair={{ variant: 'long', color: '#FF5CA8' }}
      headwear={{ variant: 'crown', color: GOLD, accent: '#7CD6FF' }}
      mask={{ color: LEMON }}
      accessories={[{ kind: 'bowtie', color: GOLD }]}
      front={
        /* Little sparkles drifting around the star of the show. */
        <g data-part="custom" data-kind="sparkles">
          <Sparkle x={105} y={18} s={1.1} />
          <Sparkle x={12} y={20} s={0.8} />
          <Sparkle x={110} y={42} s={0.7} />
        </g>
      }
    />
  );
}

export const character: Character = {
  id: 'glow',
  color: LEMON,
  look: { skin: 'fair', hair: 'long', headwear: 'crown' },
  Face,
};
