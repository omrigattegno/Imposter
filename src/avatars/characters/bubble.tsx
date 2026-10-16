/** Bubble: fair skin, ginger pigtails with a pink bow, striped shirt, soap bubbles drifting by. Mask: sky. */
import { AVATAR_COLORS, type Character, type FaceProps } from '../core';
import { INK, Person, WHITE } from '../parts';

const SKY = AVATAR_COLORS.bubble;

function Bubble({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={SKY} fillOpacity={0.45} stroke={INK} strokeWidth={2.5} />
      <path d={`M${cx - r * 0.55} ${cy - r * 0.1} A${r * 0.6} ${r * 0.6} 0 0 1 ${cx - r * 0.1} ${cy - r * 0.55}`} fill="none" stroke={WHITE} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function Face({ mood }: FaceProps) {
  return (
    <Person
      mood={mood}
      skin="fair"
      head="round"
      shirt="#FFD6E8"
      hair={{ variant: 'pigtails', color: '#F2A65A' }}
      headwear={{ variant: 'bow', color: '#FF7EB6', accent: '#FFD6E8' }}
      mask={{ color: SKY }}
      onShirt={
        <g data-part="custom" data-kind="stripes" fill={SKY}>
          <rect x={32} y={95} width={56} height={4} rx={2} />
          <rect x={33} y={104} width={54} height={4} rx={2} />
        </g>
      }
      front={
        <g data-part="custom" data-kind="bubbles">
          <Bubble cx={106} cy={20} r={7} />
          <Bubble cx={112} cy={36} r={4} />
          <Bubble cx={98} cy={8} r={3} />
        </g>
      }
    />
  );
}

export const character: Character = {
  id: 'bubble',
  color: SKY,
  look: { skin: 'fair', hair: 'pigtails', headwear: 'bow' },
  Face,
};
