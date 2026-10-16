/** Ivy: light skin, spiky leaf-green hair with a leaf tucked in, a vine climbing a terracotta-pot shirt. Mask: lime. */
import { AVATAR_COLORS, type Character, type FaceProps } from '../core';
import { INK, Person } from '../parts';

const LIME = AVATAR_COLORS.ivy;
const STEM = '#2E8B57';
const LEAF = 'M0 0 C2 -6, 8 -8, 12 -4 C10 2, 4 4, 0 0 Z';

function Leaf({ x, y, rot, s = 1 }: { x: number; y: number; rot: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} data-kind="leaf">
      <path d={LEAF} fill={LIME} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M1.5 -0.5 L9.5 -3.5" fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  );
}

function Face({ mood }: FaceProps) {
  return (
    <Person
      mood={mood}
      skin="light"
      head="tall"
      shirt="#C9643B"
      hair={{ variant: 'spiky', color: STEM }}
      mask={{ color: LIME }}
      onShirt={
        /* A vine with leaves climbing from the hem up to the shoulder. */
        <g data-part="custom" data-kind="vine">
          <path d="M30 112 C38 100, 52 102, 64 96 C70 93, 76 94, 80 98" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <path d="M30 112 C38 100, 52 102, 64 96 C70 93, 76 94, 80 98" fill="none" stroke={STEM} strokeWidth={3} strokeLinecap="round" />
          <Leaf x={38} y={106} rot={-50} />
          <Leaf x={52} y={101} rot={-25} />
          <Leaf x={70} y={94} rot={-15} s={0.9} />
        </g>
      }
      front={
        /* One leaf tucked into the spikes. */
        <g data-part="custom" data-kind="leaf-clip">
          <Leaf x={86} y={26} rot={-20} s={0.9} />
        </g>
      }
    />
  );
}

export const character: Character = {
  id: 'ivy',
  color: LIME,
  look: { skin: 'light', hair: 'spiky', headwear: 'none' },
  Face,
};
