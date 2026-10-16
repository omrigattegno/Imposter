/**
 * Wordmark: the app name on a chunky yellow plate with a masked face peeking over its top edge and
 * two small hands gripping the plate. The face is drawn here (same anatomy and ink as the cast in
 * src/avatars, so it reads as one of them) and the name comes from i18n, so the Hebrew variant
 * ("מתחזה") is the same mark: logical positioning puts the face at the start edge in both directions.
 * Pure inline SVG + CSS (pregame.css .logo*), no assets, so it renders offline.
 */
import { useT } from '../../i18n';

const INK = '#1B1F3B';
const SKIN = '#F3CBA5';
const HAIR = '#4A2C1A';
const MASK = '#FF5C7A';
const WHITE = '#FFFFFF';

/* Domino mask over y 42..70 (same silhouette as the cast's). */
const MASK_PATH =
  'M60 50 C54 43, 44 41, 34 43 C25 45, 15 47, 17 54 C19 64, 31 71, 42 70 C51 69, 57 65, 60 61 ' +
  'C63 65, 69 69, 78 70 C89 71, 101 64, 103 54 C105 47, 95 45, 86 43 C76 41, 66 43, 60 50 Z';

function Finger({ x }: { x: number }) {
  return <rect x={x} y={2} width={11} height={24} rx={5.5} fill={SKIN} stroke={INK} strokeWidth={3.5} />;
}

export function Logo({ tagline = true }: { tagline?: boolean }) {
  const t = useT();
  return (
    <div className="logo">
      <div className="logo__mark">
        {/* The face: everything below y 70 is hidden behind the plate. */}
        <svg className="logo__face" viewBox="0 10 120 60" aria-hidden="true" focusable="false">
          <circle cx={60} cy={56} r={36} fill={SKIN} stroke={INK} strokeWidth={5} />
          <path
            d="M26 54 C23 30, 38 15, 60 15 C82 15, 97 30, 94 54 C92 42, 86 33, 78 31 C72 29.5, 66 32, 60 31 C54 32, 48 29.5, 42 31 C34 33, 28 42, 26 54 Z"
            fill={HAIR}
            stroke={INK}
            strokeWidth={5}
            strokeLinejoin="round"
          />
          {/* a cheeky tuft */}
          <path d="M70 19 C74 12.5, 84 12.5, 86 19" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
          <path d="M70 19 C74 13.5, 83 13.5, 85 19 Z" fill={HAIR} />
          <path d={MASK_PATH} fill={MASK} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          {/* eyes through the mask holes, looking sideways at the name */}
          <circle cx={45} cy={56} r={9.5} fill={WHITE} stroke={INK} strokeWidth={4} />
          <circle cx={75} cy={56} r={9.5} fill={WHITE} stroke={INK} strokeWidth={4} />
          <circle cx={48} cy={57} r={4.2} fill={INK} />
          <circle cx={78} cy={57} r={4.2} fill={INK} />
          <circle cx={49.8} cy={55} r={1.6} fill={WHITE} />
          <circle cx={79.8} cy={55} r={1.6} fill={WHITE} />
          {/* sneaky brows: one raised */}
          <g fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round">
            <path d="M37 37 Q45 31 53 37" />
            <path d="M68 45 Q75 43 82 45" />
          </g>
          {/* cheeks just above the plate edge */}
          <ellipse cx={34} cy={67} rx={5.5} ry={3.5} fill="#FF8FAE" opacity={0.85} />
          <ellipse cx={86} cy={67} rx={5.5} ry={3.5} fill="#FF8FAE" opacity={0.85} />
        </svg>

        <h1 className="logo__name">{t('app.name')}</h1>

        {/* Fingers hooked over the plate edge, drawn in front of it. */}
        <svg className="logo__hands" viewBox="0 0 120 30" aria-hidden="true" focusable="false">
          <Finger x={27} />
          <Finger x={39} />
          <Finger x={51} />
          <Finger x={67} />
          <Finger x={79} />
          <Finger x={91} />
        </svg>
      </div>
      {tagline && <p className="logo__tagline">{t('home.tagline')}</p>}
    </div>
  );
}
