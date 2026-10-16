/** Bolt: brown skin, electric-blue mohawk, lightning on the shirt and a lightning earring. Mask: yellow. */
import { AVATAR_COLORS, type Character, type FaceProps } from '../core';
import { INK, Person } from '../parts';

const BOLT = AVATAR_COLORS.bolt;

function Face({ mood }: FaceProps) {
  return (
    <Person
      mood={mood}
      skin="brown"
      head="square"
      shirt="#EEF1FF"
      hair={{ variant: 'mohawk', color: '#3D7BFF' }}
      mask={{ color: BOLT }}
      onShirt={
        <path
          data-part="custom"
          data-kind="lightning"
          d="M62 90 L52 103 L59 103 L56 114 L68 99 L61 99 L65 90 Z"
          fill={BOLT}
          stroke={INK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      }
      front={
        <g data-part="custom" data-kind="bolt-earring" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M98 66 L94 72 L99 72 L96 79" stroke={INK} strokeWidth={6} />
          <path d="M98 66 L94 72 L99 72 L96 79" stroke={BOLT} strokeWidth={2.5} />
        </g>
      }
    />
  );
}

export const character: Character = {
  id: 'bolt',
  color: BOLT,
  look: { skin: 'brown', hair: 'mohawk', headwear: 'none' },
  Face,
};
