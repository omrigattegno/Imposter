/**
 * Inline SVG of the lift gesture: a phone flat on the table with a blurred card, a chunky arrow, then
 * a player holding the phone up to their masked face with the word lit. Contains no text so it can be
 * mirrored with CSS in RTL (the captions are HTML, rendered by the How-to screen).
 */
import { Avatar } from '../../avatars';

const INK = '#1B1F3B';

export function LiftIllustration({ title }: { title: string }) {
  return (
    <svg className="lift-illus" viewBox="0 0 320 150" role="img" aria-label={title}>
      <defs>
        <filter id="lift-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      {/* Flat on the table: card blurred */}
      <g>
        <ellipse cx={70} cy={128} rx={56} ry={9} fill={INK} opacity={0.22} />
        <rect x={42} y={26} width={56} height={96} rx={13} fill="#2A3561" stroke={INK} strokeWidth={5} />
        <rect x={49} y={35} width={42} height={72} rx={7} fill="var(--card-secret-bg)" />
        <g filter="url(#lift-blur)" stroke="var(--card-secret-text)" strokeWidth={5} strokeLinecap="round" opacity={0.75}>
          <line x1={59} y1={64} x2={81} y2={64} />
          <line x1={63} y1={78} x2={77} y2={78} />
        </g>
        <circle cx={70} cy={114} r={2.4} fill="rgba(255,255,255,0.35)" />
      </g>

      {/* Lift arrow */}
      <g stroke="var(--accent)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M118 84 C 140 50, 164 50, 186 66" />
        <path d="M174 56 L186 66 L172 72" />
      </g>

      {/* Lifted toward the face: word visible */}
      <g>
        <g transform="translate(222 30)">
          <Avatar id="bubble" size={100} mood="happy" />
        </g>
        <g transform="rotate(28 212 98)">
          <rect x={190} y={60} width={44} height={76} rx={10} fill="#2A3561" stroke={INK} strokeWidth={5} />
          <rect x={196} y={67} width={32} height={56} rx={6} fill="var(--card-secret-bg)" />
          <g stroke="var(--accent)" strokeWidth={5} strokeLinecap="round">
            <line x1={203} y1={90} x2={221} y2={90} />
            <line x1={206} y1={102} x2={218} y2={102} />
          </g>
          <circle cx={212} cy={130} r={2.2} fill="rgba(255,255,255,0.35)" />
        </g>
        {/* a little glow from the lit card */}
        <path d="M236 78 L256 70 M238 90 L258 92" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      </g>
    </svg>
  );
}
