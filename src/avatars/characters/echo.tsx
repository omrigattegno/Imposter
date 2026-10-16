/** Echo: medium skin, long teal waves under purple headphones, music notes floating by. Mask: orange. */
import { AVATAR_COLORS, type Character, type FaceProps } from '../core';
import { INK, Person } from '../parts';

const ORANGE = AVATAR_COLORS.echo;

function Note({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} data-kind="note">
      <path d="M3 -12 V0" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <path d="M3 -12 Q9 -11 8 -5" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={0} cy={0} rx={4} ry={3} fill={ORANGE} stroke={INK} strokeWidth={2.5} />
    </g>
  );
}

function Face({ mood }: FaceProps) {
  return (
    <Person
      mood={mood}
      skin="medium"
      head="round"
      shirt="#4C6FFF"
      hair={{ variant: 'waves', color: '#2F6B74' }}
      headwear={{ variant: 'headphones', color: '#8B5CF6' }}
      mask={{ color: ORANGE }}
      front={
        <g data-part="custom" data-kind="notes">
          <Note x={105} y={34} s={1.15} />
          <Note x={110} y={16} s={0.8} />
        </g>
      }
    />
  );
}

export const character: Character = {
  id: 'echo',
  color: ORANGE,
  look: { skin: 'medium', hair: 'waves', headwear: 'headphones' },
  Face,
};
