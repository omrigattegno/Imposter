/** Jet: medium skin, bald under a red polka bandana, goggles on the mask, sky scarf over a silver flight suit, speed lines behind. Mask: periwinkle. */
import { AVATAR_COLORS, type Character, type FaceProps } from '../core';
import { INK, Person, WHITE } from '../parts';

const BLUE = AVATAR_COLORS.jet;
const RED = '#FF5252';
const SKY = '#7CD6FF';
const GOLD = '#FFC857';

function SpeedLine({ d }: { d: string }) {
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={INK} strokeWidth={8} />
      <path d={d} stroke={SKY} strokeWidth={3.5} />
    </g>
  );
}

function Face({ mood }: FaceProps) {
  return (
    <Person
      mood={mood}
      skin="medium"
      head="square"
      shirt="#BFC9E0"
      headwear={{ variant: 'bandana', color: RED, accent: WHITE }}
      mask={{ color: BLUE, glasses: true }}
      accessories={[{ kind: 'scarf', color: SKY }]}
      behind={
        /* Whoosh: speed lines trailing behind. */
        <g data-part="custom" data-kind="speed-lines">
          <SpeedLine d="M2 66 L16 66" />
          <SpeedLine d="M5 76 L19 76" />
          <SpeedLine d="M1 86 L15 86" />
        </g>
      }
      onShirt={
        /* Pilot wings badge on the chest. */
        <g data-part="custom" data-kind="wings">
          <path d="M46 107 L35 102 L38 111 Z" fill={GOLD} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M46 107 L57 102 L54 111 Z" fill={GOLD} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <circle cx={46} cy={107} r={3.5} fill={WHITE} stroke={INK} strokeWidth={2.5} />
        </g>
      }
    />
  );
}

export const character: Character = {
  id: 'jet',
  color: BLUE,
  look: { skin: 'medium', hair: 'none', headwear: 'bandana' },
  Face,
};
