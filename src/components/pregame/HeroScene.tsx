/**
 * Home hero: a huddle of five avatars around one glowing phone on the table, each bobbing on its own
 * phase (CSS, pregame.css .hero__bob; static under prefers-reduced-motion). One SVG scene: the
 * characters are nested <Avatar> svgs, the table, phone and sparkles are drawn here. Decorative.
 *
 * `ids` lets Home show the group's own avatars (last game's players); fewer than four valid ids fall
 * back to the house cast so the scene always has a full table.
 */
import type { CSSProperties } from 'react';
import { Avatar, isAvatarId, type AvatarId, type AvatarMood } from '../../avatars';

const INK = '#1B1F3B';

interface Seat {
  x: number;
  y: number;
  size: number;
  mood: AvatarMood;
  /** Seconds into the bob loop at mount (negative delay), so nobody bobs in sync. */
  phase: number;
  /** Loop length in seconds; slightly different per seat for an organic feel. */
  dur: number;
  /** Drawn behind the phone (back row) or in front of it. */
  back: boolean;
}

/* Scene is 360 x 200. The phone sits on the table at the centre; the sneaky one is on the left. */
const SEATS: Seat[] = [
  { x: 120, y: 30, size: 84, mood: 'shocked', phase: -0.5, dur: 3.0, back: true },
  { x: 54, y: 4, size: 92, mood: 'happy', phase: 0, dur: 2.8, back: true },
  { x: 214, y: 0, size: 96, mood: 'think', phase: -0.9, dur: 3.2, back: true },
  { x: 0, y: 52, size: 106, mood: 'sneaky', phase: -1.7, dur: 2.7, back: false },
  { x: 256, y: 50, size: 106, mood: 'idle', phase: -2.3, dur: 3.1, back: false },
];

const HOUSE_CAST: AvatarId[] = ['bubble', 'bean', 'bolt', 'echo', 'dot'];

function castFor(ids: readonly string[] | undefined): AvatarId[] {
  const own: AvatarId[] = [];
  for (const id of ids ?? []) if (isAvatarId(id) && !own.includes(id)) own.push(id);
  if (own.length < 4) return HOUSE_CAST;
  // Fill the fifth seat from the house cast when the group has exactly four.
  for (const id of HOUSE_CAST) {
    if (own.length >= SEATS.length) break;
    if (!own.includes(id)) own.push(id);
  }
  return own.slice(0, SEATS.length);
}

function Seated({ seat, id }: { seat: Seat; id: AvatarId }) {
  const style = { animationDelay: `${seat.phase}s`, animationDuration: `${seat.dur}s` } as CSSProperties;
  return (
    <g className="hero__bob" style={style}>
      <g transform={`translate(${seat.x} ${seat.y})`}>
        <Avatar id={id} size={seat.size} mood={seat.mood} />
      </g>
    </g>
  );
}

function Spark({ x, y, r, delay }: { x: number; y: number; r: number; delay: number }) {
  const d = `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;
  return <path className="hero__spark" d={d} fill="var(--accent-2)" style={{ animationDelay: `${delay}s` }} />;
}

export function HeroScene({ ids }: { ids?: readonly string[] }) {
  const cast = castFor(ids);
  return (
    <div className="hero anim-pop-in">
      <svg className="hero__scene" viewBox="0 0 360 200" aria-hidden="true" focusable="false">
        <defs>
          <filter id="hero-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="hero-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>

        {/* table */}
        <ellipse cx={180} cy={152} rx={176} ry={44} fill="var(--bg-elev-2)" stroke="var(--line)" />
        <ellipse cx={180} cy={140} rx={80} ry={46} fill="var(--accent)" opacity={0.16} filter="url(#hero-glow)" />

        {SEATS.map((seat, i) => seat.back && <Seated key={i} seat={seat} id={cast[i]} />)}

        {/* the phone, face up, secret card lit */}
        <g transform="rotate(-8 180 138)">
          <ellipse cx={182} cy={180} rx={36} ry={6} fill={INK} opacity={0.28} />
          <rect x={150} y={98} width={60} height={82} rx={12} fill="#2A3561" stroke={INK} strokeWidth={5} />
          <rect x={156} y={106} width={48} height={62} rx={7} fill="#000" />
          <g stroke="var(--accent)" strokeWidth={5} strokeLinecap="round" filter="url(#hero-blur)">
            <line x1={166} y1={130} x2={194} y2={130} />
            <line x1={170} y1={144} x2={190} y2={144} />
          </g>
          <circle cx={180} cy={174} r={2.5} fill="rgba(255,255,255,0.35)" />
        </g>

        {SEATS.map((seat, i) => !seat.back && <Seated key={i} seat={seat} id={cast[i]} />)}

        <Spark x={30} y={30} r={7} delay={0} />
        <Spark x={330} y={22} r={5} delay={-0.8} />
        <Spark x={304} y={120} r={4} delay={-1.5} />
        <Spark x={58} y={150} r={4} delay={-0.4} />
      </svg>
    </div>
  );
}
