/** Fig: deep skin, black braids with purple beads, a pink blossom tucked in, gold earring, a ripe fig on a cream shirt. Mask: purple. */
import { AVATAR_COLORS, type Character, type FaceProps } from '../core';
import { INK, Person } from '../parts';

const PURPLE = AVATAR_COLORS.fig;

function Face({ mood }: FaceProps) {
  return (
    <Person
      mood={mood}
      skin="deep"
      head="round"
      shirt="#FFF1D6"
      hair={{ variant: 'braids', color: '#241A2E' }}
      headwear={{ variant: 'flower', color: '#FF9CC6', accent: '#FFE66D' }}
      mask={{ color: PURPLE }}
      accessories={[{ kind: 'earring', color: '#FFC857' }]}
      onShirt={
        /* A ripe fig with its stem and a leaf, printed on the shirt. */
        <g data-part="custom" data-kind="fig">
          <path d="M60 91 C51 94, 47 102, 52 108 C56 113, 64 113, 68 108 C73 102, 69 94, 60 91 Z" fill={PURPLE} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M60 91 L61 86" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          <path d="M61 88 C63 83, 69 83, 70 87 C67 90, 63 90, 61 88 Z" fill="#8BE35A" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        </g>
      }
      front={
        /* Beads threaded on the braids. */
        <g data-part="custom" data-kind="beads" fill={PURPLE} stroke={INK} strokeWidth={2}>
          <circle cx={21} cy={80} r={3} />
          <circle cx={99} cy={80} r={3} />
        </g>
      }
    />
  );
}

export const character: Character = {
  id: 'fig',
  color: PURPLE,
  look: { skin: 'deep', hair: 'braids', headwear: 'flower' },
  Face,
};
