/** Cloud: tan skin, a big fluffy white puff of hair with a star clip, round glasses on the mask. Mask: lavender. */
import { AVATAR_COLORS, type Character, type FaceProps } from '../core';
import { Person, Star } from '../parts';

function Face({ mood }: FaceProps) {
  return (
    <Person
      mood={mood}
      skin="tan"
      head="round"
      shirt="#FFB347"
      hair={{ variant: 'puff', color: '#F7F4FF' }}
      mask={{ color: AVATAR_COLORS.cloud, glasses: true }}
      front={
        <g data-part="custom" data-kind="star-clip">
          <Star cx={31} cy={30} r={7} color="#FFC857" />
        </g>
      }
    />
  );
}

export const character: Character = {
  id: 'cloud',
  color: AVATAR_COLORS.cloud,
  look: { skin: 'tan', hair: 'puff', headwear: 'none' },
  Face,
};
