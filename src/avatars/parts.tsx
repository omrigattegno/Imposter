/**
 * Shared character parts for the avatar cast (120x120 viewBox, "cute & rounded").
 *
 * Anatomy (all parts agree on these coordinates):
 *   head centre (60,56) r 36  |  eyes (45,56) and (75,56)  |  brows around y 40  |  nose (60,64)
 *   mouth centre (60,77)      |  cheeks (40,72) (80,72)     |  body 22..98 x 84..114  |  shadow (60,112)
 *   mask: winged domino over y 42..70; the eyes' own outlines are its holes (skin discs sit under them).
 *   Headwear keeps its lower edge above y 32 between x 37..83 so raised brows stay visible.
 * Z-order (what <Person> does for you):
 *   Shadow, [behind], Body(+onShirt), Hair back, Head(+ears), Cheeks, Nose, Mouth, [onFace], Mask(+glasses),
 *   Eyes(+blink lids), Brows, Hair front, Headwear, Accessories, [front].
 * Moods change only Eyes/Brows/Mouth. The eyes sit on top of the mask so they read as the mask's holes;
 * when the mask drops the skin discs under them blend into the face.
 *
 * Outlines are INK at 5-6 units (features 4-4.5), flat fills, no gradients, no external assets.
 */
import { useContext, type ReactNode } from 'react';
import {
  MaskStateContext,
  type AccessoryKind,
  type AvatarMood,
  type HairVariant,
  type HeadShape,
  type HeadwearVariant,
  type SkinTone,
} from './core';

export const INK = '#1B1F3B';
export const WHITE = '#FFFFFF';
export const CHEEK = '#FF8FAE';

/** Six skin tones; use all six across the cast. */
export const SKIN: Record<SkinTone, string> = {
  fair: '#FFE3CC',
  light: '#F3CBA5',
  tan: '#DDA477',
  medium: '#BC7E58',
  brown: '#8E5A3B',
  deep: '#5B3A2A',
};

const EYE_L = 45;
const EYE_R = 75;
const EYE_Y = 56;

/* ------------------------------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------------------------- */

export interface PuffCircle {
  cx: number;
  cy: number;
  r: number;
}

/**
 * Draws a union of circles (and optional paths) with ONE clean outline: an ink layer painted with a fat
 * stroke, then the flat colour on top. Use it for curls, puffs, clouds, petals, braids...
 */
export function Puffs({
  circles,
  paths = [],
  color,
  stroke = 5,
}: {
  circles: PuffCircle[];
  paths?: string[];
  color: string;
  stroke?: number;
}) {
  return (
    <g>
      {paths.map((d, i) => (
        <path key={`o${i}`} d={d} fill={INK} stroke={INK} strokeWidth={stroke * 2} strokeLinejoin="round" />
      ))}
      {circles.map((c, i) => (
        <circle key={`o${i}`} cx={c.cx} cy={c.cy} r={c.r} fill={INK} stroke={INK} strokeWidth={stroke * 2} />
      ))}
      {paths.map((d, i) => (
        <path key={`f${i}`} d={d} fill={color} />
      ))}
      {circles.map((c, i) => (
        <circle key={`f${i}`} cx={c.cx} cy={c.cy} r={c.r} fill={color} />
      ))}
    </g>
  );
}

/** A tiny five-point star (hair clips, stickers). */
export function Star({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return <polygon points={pts.join(' ')} fill={color} stroke={INK} strokeWidth={3} strokeLinejoin="round" />;
}

/* ------------------------------------------------------------------------------------------------
 * Base anatomy
 * ---------------------------------------------------------------------------------------------- */

export function Shadow() {
  return <ellipse data-part="shadow" cx={60} cy={112} rx={43} ry={6} fill={INK} opacity={0.22} />;
}

/** Stubby shoulders in the shirt colour; children are drawn on the shirt (logos, stripes, dots). */
export function Body({ color, children }: { color: string; children?: ReactNode }) {
  return (
    <g data-part="body">
      <rect x={22} y={84} width={76} height={30} rx={16} fill={color} stroke={INK} strokeWidth={5} />
      {children}
    </g>
  );
}

const EAR_X: Record<HeadShape, [number, number]> = { round: [25, 95], square: [25, 95], tall: [28, 92] };

export function Head({ shape = 'round', skin }: { shape?: HeadShape; skin: SkinTone }) {
  const fill = SKIN[skin];
  const [el, er] = EAR_X[shape];
  return (
    <g data-part="head">
      <circle cx={el} cy={60} r={7} fill={fill} stroke={INK} strokeWidth={5} />
      <circle cx={er} cy={60} r={7} fill={fill} stroke={INK} strokeWidth={5} />
      {shape === 'round' && <circle cx={60} cy={56} r={36} fill={fill} stroke={INK} strokeWidth={6} />}
      {shape === 'square' && <rect x={24} y={20} width={72} height={72} rx={26} fill={fill} stroke={INK} strokeWidth={6} />}
      {shape === 'tall' && <ellipse cx={60} cy={56} rx={33} ry={38} fill={fill} stroke={INK} strokeWidth={6} />}
    </g>
  );
}

export function Cheeks({ color = CHEEK }: { color?: string }) {
  return (
    <g data-part="cheeks" opacity={0.75}>
      <ellipse cx={40} cy={72} rx={7} ry={4.5} fill={color} />
      <ellipse cx={80} cy={72} rx={7} ry={4.5} fill={color} />
    </g>
  );
}

export function Nose() {
  return <path data-part="nose" d="M56 62 Q60 68 64 62" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
}

/* ------------------------------------------------------------------------------------------------
 * Mood features: eyes, brows, mouth
 * ---------------------------------------------------------------------------------------------- */

function Eye({ cx, mood, skin, tear }: { cx: number; mood: AvatarMood; skin: SkinTone; tear?: boolean }) {
  const cy = EYE_Y;
  const wide = mood === 'shocked';
  const scleraR = wide ? 10.5 : 9;
  // The eye's own outline is the edge of the mask's hole: the skin disc under it only shows when the
  // eye is closed (blink, sneaky lid, happy arc).
  const holeR = scleraR + 2;
  const hole = <circle cx={cx} cy={cy} r={holeR} fill={SKIN[skin]} />;
  if (mood === 'happy') {
    return (
      <g>
        {hole}
        <path d={`M${cx - 8} ${cy + 3} Q${cx} ${cy - 8} ${cx + 8} ${cy + 3}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      </g>
    );
  }
  const pupilR = wide ? 3.6 : 5;
  let px = cx + 1;
  let py = cy + 1;
  if (wide) {
    px = cx;
    py = cy + 0.5;
  } else if (mood === 'think') {
    px = cx + 3;
    py = cy - 3.5;
  } else if (mood === 'sad') {
    py = cy + 2.5;
  }
  return (
    <g>
      {hole}
      <circle cx={cx} cy={cy} r={scleraR} fill={WHITE} stroke={INK} strokeWidth={4} />
      <circle cx={px} cy={py} r={pupilR} fill={INK} />
      <circle cx={px + 1.6} cy={py - 1.6} r={wide ? 1.3 : 1.8} fill={WHITE} />
      <circle cx={px - 1.8} cy={py + 1.8} r={0.9} fill={WHITE} opacity={0.8} />
      {mood === 'sneaky' && (
        <g>
          <path d={`M${cx - holeR} ${cy - 0.5} A${holeR} ${holeR} 0 0 1 ${cx + holeR} ${cy - 0.5} Z`} fill={SKIN[skin]} />
          <path d={`M${cx - 9.5} ${cy - 0.5} L${cx + 9.5} ${cy - 0.5}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </g>
      )}
      {mood === 'idle' && (
        /* Blink lid: scaled from 0 to 1 by avatars.css (random phase per avatar instance). */
        <g className="av-lid" data-part="lid">
          <circle cx={cx} cy={cy} r={holeR} fill={SKIN[skin]} />
          <path d={`M${cx - 7} ${cy + 1} Q${cx} ${cy + 7} ${cx + 7} ${cy + 1}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </g>
      )}
      {tear && (
        <path d={`M${cx + 11} ${cy + 3} C${cx + 8} ${cy + 8}, ${cx + 7} ${cy + 12}, ${cx + 11} ${cy + 13} C${cx + 15} ${cy + 12}, ${cx + 14} ${cy + 8}, ${cx + 11} ${cy + 3} Z`} fill="#7CD6FF" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      )}
    </g>
  );
}

/** Both eyes (drawn above the mask, so they read as its eye holes). */
export function Eyes({ mood, skin }: { mood: AvatarMood; skin: SkinTone }) {
  return (
    <g data-part="eyes" data-mood={mood}>
      <Eye cx={EYE_L} mood={mood} skin={skin} />
      <Eye cx={EYE_R} mood={mood} skin={skin} tear={mood === 'sad'} />
    </g>
  );
}

const BROWS: Record<AvatarMood, [string, string]> = {
  idle: ['M37 43 Q45 38 53 42', 'M67 42 Q75 38 83 43'],
  happy: ['M37 41 Q45 35 53 40', 'M67 40 Q75 35 83 41'],
  shocked: ['M37 37 Q45 30 53 36', 'M67 36 Q75 30 83 37'],
  sneaky: ['M37 37 Q45 31 53 37', 'M68 45 Q75 43 82 45'],
  sad: ['M37 46 Q45 44 53 39', 'M67 39 Q75 44 83 46'],
  think: ['M37 39 Q45 33 53 38', 'M67 44 Q75 40 83 44'],
};

export function Brows({ mood }: { mood: AvatarMood }) {
  const [l, r] = BROWS[mood];
  return (
    <g data-part="brows" data-mood={mood} fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round">
      <path d={l} />
      <path d={r} />
    </g>
  );
}

export function Mouth({ mood }: { mood: AvatarMood }) {
  const line = (d: string) => <path d={d} fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />;
  return (
    <g data-part="mouth" data-mood={mood}>
      {mood === 'idle' && line('M53 76 Q60 83 67 76')}
      {mood === 'happy' && (
        <g>
          <path d="M47 73 Q60 94 73 73 Z" fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M54.5 79 Q60 87 65.5 79 Z" fill="#FF7EB6" />
        </g>
      )}
      {mood === 'shocked' && <ellipse cx={60} cy={79} rx={5.5} ry={7.5} fill={INK} />}
      {mood === 'sneaky' && line('M52 79 Q61 84 69 74')}
      {mood === 'sad' && line('M52 81 Q60 73 68 81')}
      {mood === 'think' && line('M53 79 L67 77')}
    </g>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Mask (controlled by <Avatar> through MaskStateContext)
 * ---------------------------------------------------------------------------------------------- */

const MASK_PATH =
  'M60 50 C54 43, 44 41, 34 43 C25 45, 15 47, 17 54 C19 64, 31 71, 42 70 C51 69, 57 65, 60 61 ' +
  'C63 65, 69 69, 78 70 C89 71, 101 64, 103 54 C105 47, 95 45, 86 43 C76 41, 66 43, 60 50 Z';

/**
 * The winged domino mask. Rendered while the mask state is 'on' or 'dropping' (then with the
 * .av-mask--off animation); not rendered when 'off'. Optional round glasses ride on the mask.
 */
export function Mask({ color, glasses = false }: { color: string; glasses?: boolean }) {
  const state = useContext(MaskStateContext);
  if (state === 'off') return null;
  return (
    <g data-part="mask" className={state === 'dropping' ? 'av-mask av-mask--off' : 'av-mask'}>
      <path d={MASK_PATH} fill={color} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {glasses && (
        <g data-part="glasses" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round">
          <circle cx={EYE_L} cy={EYE_Y} r={13.5} fill={WHITE} fillOpacity={0.14} />
          <circle cx={EYE_R} cy={EYE_Y} r={13.5} fill={WHITE} fillOpacity={0.14} />
          <path d="M58.5 54 Q60 50 61.5 54" />
          <path d="M31.5 54 L22 51" />
          <path d="M88.5 54 L98 51" />
        </g>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Hair: a back layer (behind the head, over the shoulders) and a front layer (over the forehead)
 * ---------------------------------------------------------------------------------------------- */

const CAP_SHORT =
  'M26 54 C23 30, 38 15, 60 15 C82 15, 97 30, 94 54 C92 42, 86 33, 78 31 C72 29.5, 66 32, 60 31 C54 32, 48 29.5, 42 31 C34 33, 28 42, 26 54 Z';
const CAP_PART =
  'M27 52 C24 26, 40 14, 60 14 C80 14, 96 26, 93 52 C92 38, 84 30, 72 30 C66 30, 62 34, 60 38 C58 34, 54 30, 48 30 C36 30, 28 38, 27 52 Z';
const CAP_DIP =
  'M27 52 C24 28, 38 15, 60 15 C82 15, 96 28, 93 52 C92 40, 86 32, 76 30 C70 29, 64 33, 60 36 C56 33, 50 29, 44 30 C34 32, 28 40, 27 52 Z';
const CAP_TIGHT = 'M27 50 C26 28, 40 17, 60 17 C80 17, 94 28, 93 50 C90 38, 80 29, 60 29 C40 29, 30 38, 27 50 Z';
const CAP_SWEPT =
  'M27 52 C24 28, 38 15, 60 15 C82 15, 96 28, 93 52 C92 40, 88 32, 78 31 C66 30, 48 30, 38 42 C34 40, 30 44, 27 52 Z';
const BANGS_BLUNT =
  'M27 50 C25 26, 40 14, 60 14 C80 14, 95 26, 93 50 L93 32 L85 35 L76 32 L68 35 L60 32 L52 35 L44 32 L36 35 L27 32 Z';
const BAND_PUFF = 'M27 46 C28 30, 42 22, 60 22 C78 22, 92 30, 93 46 C90 36, 78 30, 60 30 C42 30, 30 36, 27 46 Z';
const BACK_BOB = 'M20 60 C17 22, 38 9, 60 9 C82 9, 103 22, 100 60 L100 84 Q100 92 92 92 L28 92 Q20 92 20 84 Z';
const BACK_LONG =
  'M20 56 C17 20, 38 9, 60 9 C82 9, 103 20, 100 56 L100 96 Q100 104 92 104 L84 104 L84 72 L36 72 L36 104 L28 104 Q20 104 20 96 Z';
const BACK_WAVES = 'M20 100 L20 56 C17 20, 38 9, 60 9 C82 9, 103 20, 100 56 L100 100 L84 100 L84 72 L36 72 L36 100 Z';

function Fill({ d, color, stroke = 5 }: { d: string; color: string; stroke?: number }) {
  return <path d={d} fill={color} stroke={INK} strokeWidth={stroke} strokeLinejoin="round" />;
}

export function Hair({ variant, color, layer }: { variant: HairVariant; color: string; layer: 'back' | 'front' }) {
  if (layer === 'back') {
    switch (variant) {
      case 'bob':
        return <Fill d={BACK_BOB} color={color} />;
      case 'long':
        return <Fill d={BACK_LONG} color={color} />;
      case 'waves':
        return (
          <Puffs
            paths={[BACK_WAVES]}
            circles={[
              { cx: 18, cy: 74, r: 7 },
              { cx: 102, cy: 74, r: 7 },
              { cx: 17, cy: 88, r: 7 },
              { cx: 103, cy: 88, r: 7 },
              { cx: 27, cy: 100, r: 9 },
              { cx: 93, cy: 100, r: 9 },
            ]}
            color={color}
          />
        );
      case 'braids':
        return (
          <g>
            <Puffs
              circles={[
                { cx: 22, cy: 70, r: 8 },
                { cx: 20, cy: 84, r: 8 },
                { cx: 22, cy: 98, r: 7 },
                { cx: 98, cy: 70, r: 8 },
                { cx: 100, cy: 84, r: 8 },
                { cx: 98, cy: 98, r: 7 },
              ]}
              color={color}
            />
            <ellipse cx={22} cy={92} rx={6} ry={2} fill={INK} />
            <ellipse cx={98} cy={92} rx={6} ry={2} fill={INK} />
          </g>
        );
      case 'puff':
        return (
          <Puffs
            circles={[
              { cx: 22, cy: 58, r: 12 },
              { cx: 98, cy: 58, r: 12 },
              { cx: 26, cy: 40, r: 15 },
              { cx: 94, cy: 40, r: 15 },
              { cx: 36, cy: 22, r: 15 },
              { cx: 84, cy: 22, r: 15 },
              { cx: 60, cy: 14, r: 14 },
            ]}
            color={color}
          />
        );
      case 'pigtails':
        return (
          <Puffs
            circles={[
              { cx: 14, cy: 40, r: 11.5 },
              { cx: 106, cy: 40, r: 11.5 },
            ]}
            color={color}
          />
        );
      default:
        return null;
    }
  }
  switch (variant) {
    case 'short':
      return <Fill d={CAP_SHORT} color={color} />;
    case 'curls':
      return (
        <Puffs
          circles={[
            { cx: 29, cy: 50, r: 9 },
            { cx: 31, cy: 36, r: 9 },
            { cx: 40, cy: 24, r: 9 },
            { cx: 52, cy: 19, r: 10 },
            { cx: 66, cy: 18, r: 10 },
            { cx: 79, cy: 24, r: 10 },
            { cx: 89, cy: 35, r: 9 },
            { cx: 91, cy: 50, r: 9 },
          ]}
          color={color}
        />
      );
    case 'bun':
      return (
        <g>
          <circle cx={60} cy={12} r={10} fill={color} stroke={INK} strokeWidth={5} />
          <Fill d={CAP_TIGHT} color={color} />
          <path d="M53 21 Q60 24 67 21" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    case 'bob':
      return <Fill d={BANGS_BLUNT} color={color} />;
    case 'braids':
      return <Fill d={CAP_DIP} color={color} />;
    case 'mohawk':
      return <Fill d="M37 31 L44 6 L52 20 L60 2 L68 20 L76 6 L83 31 Q60 24 37 31 Z" color={color} />;
    case 'waves':
      return <Fill d={CAP_SWEPT} color={color} />;
    case 'long':
      return <Fill d={CAP_PART} color={color} />;
    case 'puff':
      return <Fill d={BAND_PUFF} color={color} />;
    case 'spiky':
      return <Fill d="M26 44 L30 20 L40 34 L48 10 L56 30 L62 6 L70 30 L78 10 L86 34 L92 20 L94 44 C80 28, 40 28, 26 44 Z" color={color} />;
    case 'pigtails':
      return (
        <g>
          <Fill d={CAP_PART} color={color} />
          <circle cx={24} cy={45} r={3.5} fill={INK} />
          <circle cx={96} cy={45} r={3.5} fill={INK} />
        </g>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------------------------------------
 * Headwear (drawn over the hair)
 * ---------------------------------------------------------------------------------------------- */

export function Headwear({ variant, color, accent = WHITE }: { variant: HeadwearVariant; color: string; accent?: string }) {
  switch (variant) {
    case 'beanie':
      return (
        <g data-part="headwear">
          <Fill d="M24 32 C22 10, 38 4, 60 4 C82 4, 98 10, 96 32 Z" color={color} />
          <rect x={22} y={23} width={76} height={9} rx={4.5} fill={color} stroke={INK} strokeWidth={5} />
          <circle cx={60} cy={5} r={4} fill={accent} stroke={INK} strokeWidth={3.5} />
        </g>
      );
    case 'cap':
      return (
        <g data-part="headwear">
          <Fill d="M26 30 C24 8, 40 3, 60 3 C80 3, 96 8, 94 30 Z" color={color} />
          <path d="M68 26 C90 22, 110 26, 112 33 C108 39, 90 38, 70 34 Z" fill={accent} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <rect x={24} y={24} width={72} height={8} rx={4} fill={color} stroke={INK} strokeWidth={5} />
          <circle cx={60} cy={4} r={3} fill={accent} stroke={INK} strokeWidth={3} />
        </g>
      );
    case 'flower':
      return (
        <g data-part="headwear">
          <Puffs
            circles={[
              { cx: 90, cy: 18, r: 6 },
              { cx: 97, cy: 23.5, r: 6 },
              { cx: 95, cy: 32, r: 6 },
              { cx: 85, cy: 32, r: 6 },
              { cx: 83, cy: 23.5, r: 6 },
            ]}
            color={color}
            stroke={4}
          />
          <circle cx={90} cy={26} r={5} fill={accent} stroke={INK} strokeWidth={3} />
        </g>
      );
    case 'headband':
      return (
        <g data-part="headwear">
          <Fill d="M25 42 C27 26, 42 17, 60 17 C78 17, 93 26, 95 42 C92 32, 78 25, 60 25 C42 25, 28 32, 25 42 Z" color={color} />
          <path d="M91 30 L101 23 L99 34 Z" fill={color} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M91 32 L101 40 L96 30 Z" fill={color} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        </g>
      );
    case 'headphones':
      return (
        <g data-part="headwear">
          <path d="M22 54 C18 20, 40 6, 60 6 C80 6, 102 20, 98 54" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
          <path d="M22 54 C18 20, 40 6, 60 6 C80 6, 102 20, 98 54" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
          <rect x={13} y={44} width={17} height={23} rx={7} fill={color} stroke={INK} strokeWidth={5} />
          <rect x={90} y={44} width={17} height={23} rx={7} fill={color} stroke={INK} strokeWidth={5} />
          <circle cx={21.5} cy={55.5} r={3.5} fill={INK} opacity={0.5} />
          <circle cx={98.5} cy={55.5} r={3.5} fill={INK} opacity={0.5} />
        </g>
      );
    case 'bandana':
      return (
        <g data-part="headwear">
          <path d="M22 46 L8 40 L13 51 Z" fill={color} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M22 48 L7 55 L15 58 Z" fill={color} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <Fill d="M22 44 C22 16, 40 7, 60 7 C80 7, 98 16, 98 44 C88 32, 74 28, 60 28 C46 28, 32 32, 22 44 Z" color={color} />
          <g fill={accent} opacity={0.75}>
            <circle cx={42} cy={19} r={2.2} />
            <circle cx={60} cy={14} r={2.2} />
            <circle cx={78} cy={19} r={2.2} />
            <circle cx={50} cy={25} r={1.6} />
            <circle cx={70} cy={25} r={1.6} />
          </g>
        </g>
      );
    case 'bow':
      return (
        <g data-part="headwear">
          <ellipse cx={72} cy={22} rx={10} ry={7} transform="rotate(-18 72 22)" fill={color} stroke={INK} strokeWidth={4} />
          <ellipse cx={92} cy={22} rx={10} ry={7} transform="rotate(18 92 22)" fill={color} stroke={INK} strokeWidth={4} />
          <circle cx={82} cy={22} r={4.5} fill={accent} stroke={INK} strokeWidth={3.5} />
        </g>
      );
    case 'crown':
      return (
        <g data-part="headwear">
          <Fill d="M34 30 L36 6 L48 18 L60 2 L72 18 L84 6 L86 30 Z" color={color} />
          <circle cx={48} cy={24} r={2.5} fill={accent} />
          <circle cx={60} cy={20} r={2.5} fill={accent} />
          <circle cx={72} cy={24} r={2.5} fill={accent} />
        </g>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------------------------------------
 * Accessories (drawn last)
 * ---------------------------------------------------------------------------------------------- */

export interface AccessorySpec {
  kind: AccessoryKind;
  color?: string;
}

export function Accessory({ kind, color = '#FFC857' }: AccessorySpec) {
  switch (kind) {
    case 'freckles':
      return (
        <g data-part="accessory" data-kind={kind} fill={INK} opacity={0.38}>
          <circle cx={36} cy={70.5} r={1.6} />
          <circle cx={42} cy={74.5} r={1.6} />
          <circle cx={47} cy={70} r={1.6} />
          <circle cx={73} cy={70} r={1.6} />
          <circle cx={78} cy={74.5} r={1.6} />
          <circle cx={84} cy={70.5} r={1.6} />
        </g>
      );
    case 'mole':
      return <circle data-part="accessory" data-kind={kind} cx={72} cy={70} r={2.2} fill={INK} />;
    case 'earring':
      return <circle data-part="accessory" data-kind={kind} cx={97} cy={69} r={4} fill={color} stroke={INK} strokeWidth={3} />;
    case 'scarf':
      return (
        <g data-part="accessory" data-kind={kind}>
          <path d="M70 95 L80 114 L64 112 Z" fill={color} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <rect x={34} y={86} width={52} height={12} rx={6} fill={color} stroke={INK} strokeWidth={5} />
        </g>
      );
    case 'bowtie':
      return (
        <g data-part="accessory" data-kind={kind}>
          <path d="M48 88 L60 94 L48 100 Z" fill={color} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M72 88 L60 94 L72 100 Z" fill={color} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <circle cx={60} cy={94} r={3} fill={color} stroke={INK} strokeWidth={3} />
        </g>
      );
    case 'bandaid':
      return (
        <g data-part="accessory" data-kind={kind} transform="rotate(-20 39 71)">
          <rect x={31} y={67.5} width={16} height={7} rx={3.5} fill={color} stroke={INK} strokeWidth={3} />
          <circle cx={37} cy={71} r={1} fill={INK} opacity={0.5} />
          <circle cx={41} cy={71} r={1} fill={INK} opacity={0.5} />
        </g>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------------------------------------
 * Person: composes everything in the right z-order; characters add 1-2 custom touches in the slots.
 * ---------------------------------------------------------------------------------------------- */

export interface PersonProps {
  mood: AvatarMood;
  skin: SkinTone;
  head?: HeadShape;
  /** Shirt colour. */
  shirt: string;
  hair?: { variant: HairVariant; color: string } | null;
  headwear?: { variant: HeadwearVariant; color: string; accent?: string } | null;
  mask: { color: string; glasses?: boolean };
  accessories?: AccessorySpec[];
  cheeks?: string;
  /** Slots for custom touches (SVG nodes in the 120x120 space). */
  behind?: ReactNode; // after the shadow, before the body (floating things behind the character)
  onShirt?: ReactNode; // on the shirt (logos, stripes, dots); drawn inside the body group
  onFace?: ReactNode; // on the face, under the mask and eyes
  front?: ReactNode; // on top of everything
}

export function Person({
  mood,
  skin,
  head = 'round',
  shirt,
  hair = null,
  headwear = null,
  mask,
  accessories = [],
  cheeks,
  behind,
  onShirt,
  onFace,
  front,
}: PersonProps) {
  return (
    <g data-part="face" data-face-mood={mood}>
      <Shadow />
      {behind}
      <Body color={shirt}>{onShirt}</Body>
      {hair && <Hair variant={hair.variant} color={hair.color} layer="back" />}
      <Head shape={head} skin={skin} />
      <Cheeks color={cheeks} />
      <Nose />
      <Mouth mood={mood} />
      {onFace}
      <Mask color={mask.color} glasses={mask.glasses} />
      <Eyes mood={mood} skin={skin} />
      <Brows mood={mood} />
      {hair && <Hair variant={hair.variant} color={hair.color} layer="front" />}
      {headwear && <Headwear variant={headwear.variant} color={headwear.color} accent={headwear.accent} />}
      {accessories.map((a, i) => (
        <Accessory key={`${a.kind}${i}`} kind={a.kind} color={a.color} />
      ))}
      {front}
    </g>
  );
}
