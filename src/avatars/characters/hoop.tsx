/** Hoop: brown skin, short black hair under a teal cap, gold hoop earrings, a basketball hoop on an orange jersey. Mask: teal. */
import { AVATAR_COLORS, type Character, type FaceProps } from '../core';
import { INK, Person, WHITE } from '../parts';

const TEAL = AVATAR_COLORS.hoop;
const GOLD = '#FFC857';

function HoopEarring({ cx }: { cx: number }) {
  return (
    <g fill="none">
      <circle cx={cx} cy={74} r={5} stroke={INK} strokeWidth={6.5} />
      <circle cx={cx} cy={74} r={5} stroke={GOLD} strokeWidth={3} />
    </g>
  );
}

function Face({ mood }: FaceProps) {
  return (
    <Person
      mood={mood}
      skin="brown"
      head="square"
      shirt="#FF8C42"
      hair={{ variant: 'short', color: '#2A2238' }}
      headwear={{ variant: 'cap', color: TEAL, accent: WHITE }}
      mask={{ color: TEAL }}
      onShirt={
        /* A basketball hoop with its net, printed on the jersey. */
        <g data-part="custom" data-kind="hoop">
          <g fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M52 97 L55 109" />
            <path d="M60 98.5 L60 110" />
            <path d="M68 97 L65 109" />
            <path d="M55 103 L60 105 L65 103" />
          </g>
          <ellipse cx={60} cy={95} rx={9} ry={3.5} fill="none" stroke={INK} strokeWidth={6.5} />
          <ellipse cx={60} cy={95} rx={9} ry={3.5} fill="none" stroke={WHITE} strokeWidth={3} />
        </g>
      }
      front={
        /* Big gold hoops on both ears. */
        <g data-part="custom" data-kind="hoop-earrings">
          <HoopEarring cx={23} />
          <HoopEarring cx={97} />
        </g>
      }
    />
  );
}

export const character: Character = {
  id: 'hoop',
  color: TEAL,
  look: { skin: 'brown', hair: 'short', headwear: 'cap' },
  Face,
};
