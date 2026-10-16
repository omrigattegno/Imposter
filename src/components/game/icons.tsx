/** Small inline SVG glyphs for the in-round controls (no icon font, works offline). All decorative. */
import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  width: 24,
  height: 24,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

/** An eye: open while the card shows, a closed lid otherwise. */
export function IconEye({ open = true, ...rest }: { open?: boolean } & SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...rest}>
      {open ? (
        <>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
        </>
      ) : (
        <>
          <path d="M3 13c2.5 3 5.5 4.5 9 4.5s6.5-1.5 9-4.5" />
          <path d="M6 16.5 4.8 18.5M12 17.8V20M18 16.5l1.2 2" />
        </>
      )}
    </svg>
  );
}

/** A phone tilting up toward the reader. */
export function IconLift(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="7" y="5" width="10" height="16" rx="2.5" transform="rotate(-18 12 13)" />
      <path d="M4 9.5c0-2.5 1.5-4.5 4-5.5" strokeDasharray="1 3" />
      <path d="M8 2.5 9.2 4.4 7.3 5.2" />
    </svg>
  );
}

/** A phone lying flat with a hint of a surface under it. */
export function IconLower(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="9" width="16" height="7" rx="2" />
      <path d="M3 19.5h18" />
    </svg>
  );
}

export function IconCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={3} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Three sparkle stars (results header decoration). */
export function IconSparkle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <path d="M12 2.5 14 9l6.5 2L14 13l-2 6.5L10 13 3.5 11 10 9Z" />
      <path d="M19.5 15.5 20.3 18l2.5.8-2.5.8-.8 2.5-.8-2.5-2.5-.8 2.5-.8Z" />
      <path d="M4.5 16.5 5.1 18.3l1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6Z" />
    </svg>
  );
}
