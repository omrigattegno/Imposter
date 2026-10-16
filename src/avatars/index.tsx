/**
 * Player avatars: a cast of cute, rounded, masked cartoon people drawn as inline SVG.
 *
 * CONTRACT (the art builders implement the characters; screens only use this API):
 *  - AVATAR_IDS: the twelve character ids, in picker order.
 *  - AVATARS[id]: { id, color } — `color` is the character's signature (mask) colour, usable as an accent.
 *  - <Avatar id size mood animate unmasked /> renders one character at `size` px (square).
 *      mood: 'idle' (default, blinks now and then) | 'happy' | 'shocked' | 'sneaky' | 'sad' | 'think'
 *      animate: 'none' (default) | 'bob' (gentle idle float) | 'wiggle' | 'jump' | 'shake'
 *      unmasked: true plays the mask-off reveal (the mask slides down and drops), used on Results.
 *        The drop animates only on a false -> true transition; mounting with unmasked already true
 *        shows the bare face at once. While unmasked, the default mood ('idle') shows the "caught"
 *        (shocked) face; an explicit mood wins.
 *  - Everything is vector, offline and theme-safe; no external assets.
 *
 * Root <svg> attributes: data-avatar (id), data-mood (the prop), data-unmasked ('true'|'false'), and
 * data-placeholder="true" only while a character's file has not landed yet (see registry.tsx).
 * Characters: ./characters/<id>.tsx, shared parts: ./parts.tsx, types and colours: ./core.ts.
 */
import { useEffect, useState, type CSSProperties } from 'react';
import {
  AVATAR_COLORS,
  AVATAR_IDS,
  isAvatarId,
  MASK_DROP_MS,
  MaskStateContext,
  type AvatarAnimation,
  type AvatarId,
  type AvatarMood,
  type MaskState,
} from './core';
import { CAST, isRegistered } from './registry';
import './avatars.css';

export { AVATAR_IDS, isAvatarId };
export type { AvatarId, AvatarMood, AvatarAnimation };

export interface AvatarMeta {
  id: AvatarId;
  /** Signature colour (the mask), as a CSS colour. */
  color: string;
}

export const AVATARS: Record<AvatarId, AvatarMeta> = Object.fromEntries(
  AVATAR_IDS.map((id) => [id, { id, color: AVATAR_COLORS[id] }]),
) as Record<AvatarId, AvatarMeta>;

export interface AvatarProps {
  id: string | undefined;
  size?: number;
  mood?: AvatarMood;
  animate?: AvatarAnimation;
  unmasked?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Accessible label; omit (default) for a purely decorative avatar next to the player's name. */
  label?: string;
}

/**
 * The mask stays while `unmasked` is false; on false -> true it stays a little longer with the drop
 * animation, then leaves the DOM. Mounting with unmasked=true never shows it.
 */
function useMaskState(unmasked: boolean): MaskState {
  const [prev, setPrev] = useState(unmasked);
  const [dropping, setDropping] = useState(false);
  if (prev !== unmasked) {
    // Adjusting state from a prop change during render (React docs pattern): no flash of a bare face.
    setPrev(unmasked);
    setDropping(unmasked);
  }
  useEffect(() => {
    if (!dropping) return;
    const timer = setTimeout(() => setDropping(false), MASK_DROP_MS + 120);
    return () => clearTimeout(timer);
  }, [dropping]);
  if (!unmasked) return 'on';
  return dropping ? 'dropping' : 'off';
}

export function Avatar({ id, size = 64, mood = 'idle', animate = 'none', unmasked = false, className = '', style, label }: AvatarProps) {
  const meta = isAvatarId(id) ? AVATARS[id] : AVATARS.bean;
  const maskState = useMaskState(unmasked);
  // Random blink phase and period per instance so a row of avatars never blinks together.
  const [blink] = useState(() => ({
    delay: `${(-(Math.random() * 4.4)).toFixed(2)}s`,
    dur: `${(3.8 + Math.random() * 1.6).toFixed(2)}s`,
  }));
  const faceMood: AvatarMood = unmasked && mood === 'idle' ? 'shocked' : mood;
  const rootStyle = { '--av-blink-delay': blink.delay, '--av-blink-dur': blink.dur, ...style } as CSSProperties;
  const Face = CAST[meta.id].Face;
  return (
    <svg
      className={`avatar avatar--${animate} avatar--${mood} ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={rootStyle}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-avatar={meta.id}
      data-mood={mood}
      data-unmasked={unmasked ? 'true' : 'false'}
      data-placeholder={isRegistered(meta.id) ? undefined : 'true'}
    >
      <MaskStateContext.Provider value={maskState}>
        <Face mood={faceMood} />
      </MaskStateContext.Provider>
    </svg>
  );
}
