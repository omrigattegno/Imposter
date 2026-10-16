/** Dot: deep skin, dark bun, polka dots everywhere (headband, shirt) and a beauty mark. Mask: mint. */
import { AVATAR_COLORS, type Character, type FaceProps } from '../core';
import { Person, WHITE } from '../parts';

const CORAL = '#FF6F61';

function Face({ mood }: FaceProps) {
  return (
    <Person
      mood={mood}
      skin="deep"
      head="tall"
      shirt={CORAL}
      hair={{ variant: 'bun', color: '#2B1E33' }}
      headwear={{ variant: 'headband', color: WHITE }}
      mask={{ color: AVATAR_COLORS.dot }}
      accessories={[{ kind: 'mole' }]}
      onShirt={
        <g data-part="custom" data-kind="polka" fill={WHITE}>
          <circle cx={40} cy={96} r={3} />
          <circle cx={56} cy={100} r={3} />
          <circle cx={72} cy={95} r={3} />
          <circle cx={84} cy={103} r={3} />
          <circle cx={46} cy={108} r={3} />
          <circle cx={64} cy={110} r={3} />
        </g>
      }
      front={
        <g data-part="custom" data-kind="band-dots" fill={CORAL}>
          <circle cx={42} cy={28} r={2} />
          <circle cx={60} cy={22} r={2} />
          <circle cx={78} cy={28} r={2} />
        </g>
      }
    />
  );
}

export const character: Character = {
  id: 'dot',
  color: AVATAR_COLORS.dot,
  look: { skin: 'deep', hair: 'bun', headwear: 'headband' },
  Face,
};
