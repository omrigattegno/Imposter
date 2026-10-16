/** Kiwi: tan skin, chocolate bob under white headphones, a band-aid on the cheek, a kiwi slice on a lime shirt. Mask: pink. */
import { AVATAR_COLORS, type Character, type FaceProps } from '../core';
import { INK, Person } from '../parts';

const PINK = AVATAR_COLORS.kiwi;
const SLICE_X = 72;
const SLICE_Y = 104;
const SEEDS = [0, 60, 120, 180, 240, 300].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return { cx: +(SLICE_X + Math.cos(a) * 5.2).toFixed(1), cy: +(SLICE_Y + Math.sin(a) * 5.2).toFixed(1) };
});

function Face({ mood }: FaceProps) {
  return (
    <Person
      mood={mood}
      skin="tan"
      head="tall"
      shirt="#A3E635"
      hair={{ variant: 'bob', color: '#6B3F1F' }}
      headwear={{ variant: 'headphones', color: '#F6F7FF' }}
      mask={{ color: PINK }}
      accessories={[{ kind: 'bandaid' }]}
      onShirt={
        /* A kiwi slice printed off-centre on the shirt: fuzzy rim, green flesh, pale heart, seeds. */
        <g data-part="custom" data-kind="kiwi-slice">
          <circle cx={SLICE_X} cy={SLICE_Y} r={9.5} fill="#8E5A3B" stroke={INK} strokeWidth={2.5} />
          <circle cx={SLICE_X} cy={SLICE_Y} r={7.5} fill="#7CC242" />
          <circle cx={SLICE_X} cy={SLICE_Y} r={3} fill="#F3FFD6" />
          <g fill={INK}>
            {SEEDS.map((s, i) => (
              <circle key={i} cx={s.cx} cy={s.cy} r={1.1} />
            ))}
          </g>
        </g>
      }
    />
  );
}

export const character: Character = {
  id: 'kiwi',
  color: PINK,
  look: { skin: 'tan', hair: 'bob', headwear: 'headphones' },
  Face,
};
