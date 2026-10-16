/**
 * Small illustrations for the six "How to play" steps, drawn with the avatar cast plus a few props
 * (phone, speech and thought bubbles, a ballot, a dropped mask). Each scene is one 140 x 100 SVG with
 * nested <Avatar> svgs; no text inside, so nothing needs translating and the scenes work in RTL.
 * All decorative: the step text carries the meaning.
 */
import type { ReactNode } from 'react';
import { Avatar, AVATARS, type AvatarId, type AvatarMood } from '../../avatars';

const INK = '#1B1F3B';
const WHITE = '#FFFFFF';

/* Domino mask silhouette (120-unit coordinates, centred on the head at 60,56). */
const MASK_PATH =
  'M60 50 C54 43, 44 41, 34 43 C25 45, 15 47, 17 54 C19 64, 31 71, 42 70 C51 69, 57 65, 60 61 ' +
  'C63 65, 69 69, 78 70 C89 71, 101 64, 103 54 C105 47, 95 45, 86 43 C76 41, 66 43, 60 50 Z';

function Char({
  id,
  x,
  y,
  size,
  mood = 'idle',
  unmasked = false,
}: {
  id: AvatarId;
  x: number;
  y: number;
  size: number;
  mood?: AvatarMood;
  unmasked?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <Avatar id={id} size={size} mood={mood} unmasked={unmasked} />
    </g>
  );
}

/** A phone with the secret card lit (yellow word lines on black). */
function Phone({ x, y, w = 30, h = 50, rotate = 0 }: { x: number; y: number; w?: number; h?: number; rotate?: number }) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const pad = w * 0.12;
  return (
    <g transform={`rotate(${rotate} ${cx} ${cy})`}>
      <rect x={x} y={y} width={w} height={h} rx={w * 0.2} fill="#2A3561" stroke={INK} strokeWidth={4} />
      <rect x={x + pad} y={y + pad * 1.4} width={w - pad * 2} height={h - pad * 3.4} rx={w * 0.12} fill="#000" />
      <g stroke="var(--accent)" strokeWidth={w * 0.11} strokeLinecap="round">
        <line x1={x + w * 0.28} y1={y + h * 0.42} x2={x + w * 0.72} y2={y + h * 0.42} />
        <line x1={x + w * 0.34} y1={y + h * 0.56} x2={x + w * 0.66} y2={y + h * 0.56} />
      </g>
      <circle cx={cx} cy={y + h - pad * 1.1} r={w * 0.045} fill="rgba(255,255,255,0.35)" />
    </g>
  );
}

/** Rounded speech bubble with a tail pointing down; children are drawn inside (origin = bubble's top-left). */
function Speech({ x, y, w, h, children, tail = 'left' }: { x: number; y: number; w: number; h: number; children?: ReactNode; tail?: 'left' | 'right' }) {
  const tx = tail === 'left' ? x + w * 0.28 : x + w * 0.72;
  return (
    <g>
      <path
        d={`M${tx - 6} ${y + h - 1} L${tx} ${y + h + 9} L${tx + 6} ${y + h - 1} Z`}
        fill={WHITE}
        stroke={INK}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <rect x={x} y={y} width={w} height={h} rx={h / 2.2} fill={WHITE} stroke={INK} strokeWidth={3.5} />
      <path d={`M${tx - 4} ${y + h - 1.5} L${tx + 4} ${y + h - 1.5}`} stroke={WHITE} strokeWidth={4} />
      <g transform={`translate(${x} ${y})`}>{children}</g>
    </g>
  );
}

/** Thought cloud: puffs with one outline, plus a trail of two small bubbles. */
function Thought({
  x,
  y,
  w,
  h,
  trail,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  trail: Array<[number, number, number]>;
  children?: ReactNode;
}) {
  const puffs = [
    { cx: x + w * 0.25, cy: y + h * 0.35, r: h * 0.36 },
    { cx: x + w * 0.55, cy: y + h * 0.28, r: h * 0.4 },
    { cx: x + w * 0.8, cy: y + h * 0.45, r: h * 0.32 },
    { cx: x + w * 0.35, cy: y + h * 0.7, r: h * 0.32 },
    { cx: x + w * 0.65, cy: y + h * 0.72, r: h * 0.3 },
  ];
  return (
    <g>
      {trail.map(([cx, cy, r], i) => (
        <circle key={`t${i}`} cx={cx} cy={cy} r={r} fill={WHITE} stroke={INK} strokeWidth={3} />
      ))}
      {puffs.map((p, i) => (
        <circle key={`o${i}`} cx={p.cx} cy={p.cy} r={p.r} fill={INK} stroke={INK} strokeWidth={7} />
      ))}
      {puffs.map((p, i) => (
        <circle key={`f${i}`} cx={p.cx} cy={p.cy} r={p.r} fill={WHITE} />
      ))}
      <g transform={`translate(${x} ${y})`}>{children}</g>
    </g>
  );
}

function QuestionMark({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6 C2 0, 14 0, 14 6 C14 10, 8 10, 8 15" />
      <circle cx={8} cy={21} r={0.8} fill={INK} />
    </g>
  );
}

function Dots({ x, y }: { x: number; y: number }) {
  return (
    <g fill={INK}>
      <circle cx={x} cy={y} r={2.6} />
      <circle cx={x + 9} cy={y} r={2.6} />
      <circle cx={x + 18} cy={y} r={2.6} />
    </g>
  );
}

function Star({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return <polygon points={pts.join(' ')} fill={color} stroke={INK} strokeWidth={3} strokeLinejoin="round" />;
}

function Scene({ children }: { children: ReactNode }) {
  return (
    <svg className="howto__art" viewBox="0 0 140 100" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/* ---------- the six steps ---------- */

/** 1. Names and a category: a happy player next to a list card with three name pills and a "+". */
export function ArtNames() {
  return (
    <Scene>
      <Char id="bean" x={0} y={16} size={82} mood="happy" />
      <g transform="translate(80 12)">
        <rect x={0} y={0} width={56} height={74} rx={14} fill="var(--bg-elev-2)" stroke={INK} strokeWidth={4} />
        <rect x={9} y={11} width={38} height={10} rx={5} fill={AVATARS.bolt.color} />
        <rect x={9} y={27} width={30} height={10} rx={5} fill={AVATARS.bubble.color} />
        <rect x={9} y={43} width={34} height={10} rx={5} fill={AVATARS.dot.color} />
        <circle cx={28} cy={63} r={7.5} fill="var(--accent)" stroke={INK} strokeWidth={3} />
        <path d="M28 59.5 V66.5 M24.5 63 H31.5" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      </g>
    </Scene>
  );
}

/** 2. Pass and peek: a masked player lifting the phone to their face; the card lights up. */
export function ArtPeek() {
  return (
    <Scene>
      <Char id="bolt" x={44} y={8} size={92} />
      <Phone x={14} y={34} w={32} h={54} rotate={-26} />
      {/* motion lines: the phone rising */}
      <g fill="none" stroke="var(--accent-2)" strokeWidth={3.5} strokeLinecap="round">
        <path d="M9 72 C5 64, 5 54, 9 46" />
        <path d="M4 64 C2.5 60, 2.5 58, 4 54" />
      </g>
      <Star cx={126} cy={22} r={7} color="var(--accent)" />
    </Scene>
  );
}

/** 3. Clues in turn: three players, one speaking, the sneaky one sweating. */
export function ArtClues() {
  return (
    <Scene>
      <Char id="cloud" x={-2} y={38} size={60} />
      <Char id="dot" x={40} y={34} size={64} mood="happy" />
      <Char id="echo" x={84} y={38} size={60} mood="sneaky" />
      <Speech x={46} y={2} w={44} h={26} tail="right">
        <Dots x={13} y={13} />
      </Speech>
      {/* sweat drop */}
      <path d="M130 50 C126 56, 124 59, 124 62 A6 6 0 0 0 136 62 C136 59, 134 56, 130 50 Z" fill="var(--accent-2)" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </Scene>
  );
}

/** 4. Discussion: two players facing a big question, a clock ticking. */
export function ArtDiscuss() {
  return (
    <Scene>
      <Char id="bubble" x={-4} y={30} size={70} mood="think" />
      <Char id="kiwi" x={74} y={30} size={70} mood="shocked" />
      <Speech x={42} y={2} w={56} h={30} tail="left">
        <QuestionMark x={20} y={4} s={1} />
      </Speech>
      <g transform="translate(122 15)">
        <circle cx={0} cy={0} r={12} fill="var(--bg-elev-2)" stroke={INK} strokeWidth={3.5} />
        <path d="M0 -6 V0 L4 3" fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </Scene>
  );
}

/** 5. Vote in private: a player thinking of the ballot, one name ticked. */
export function ArtVote() {
  return (
    <Scene>
      <Char id="dot" x={2} y={14} size={86} mood="think" />
      <Thought
        x={74}
        y={8}
        w={60}
        h={46}
        trail={[
          [72, 62, 3],
          [78, 54, 4.5],
        ]}
      >
        <g transform="translate(14 10)">
          <rect x={0} y={0} width={36} height={30} rx={7} fill="var(--bg-elev-2)" stroke={INK} strokeWidth={3} />
          <rect x={6} y={7} width={16} height={6} rx={3} fill={AVATARS.cloud.color} />
          <rect x={6} y={18} width={13} height={6} rx={3} fill={AVATARS.echo.color} />
          <path d="M24 18 L28 22 L33 14" fill="none" stroke="var(--success)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </Thought>
    </Scene>
  );
}

/** 6. Caught: the Imposter unmasked, the mask on the floor, a last guess hanging in the air. */
export function ArtCaught() {
  return (
    <Scene>
      <Char id="echo" x={26} y={4} size={92} unmasked />
      {/* the dropped mask */}
      <g transform="translate(18 88) rotate(-18) scale(0.36)">
        <path d={MASK_PATH} transform="translate(-60 -56)" fill={AVATARS.echo.color} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      </g>
      <Speech x={104} y={6} w={34} h={26} tail="left">
        <QuestionMark x={10} y={3} s={0.85} />
      </Speech>
      <Star cx={14} cy={20} r={7} color="var(--accent)" />
      <Star cx={128} cy={62} r={5} color="var(--pink)" />
    </Scene>
  );
}

export const STEP_ART = [ArtNames, ArtPeek, ArtClues, ArtDiscuss, ArtVote, ArtCaught] as const;
