/**
 * The table around a centre piece: the players' avatars placed on a circle (first seat at the top,
 * clockwise), the children (the timer ring) in the middle. Decorative: names are not announced here.
 * Seats are positioned with physical left/top (a circle looks the same in RTL) and centred with negative
 * margins, not a transform, so the pop-in animation can own `transform`.
 */
import type { CSSProperties, ReactNode } from 'react';
import { Avatar, type AvatarAnimation, type AvatarId, type AvatarMood } from '../../avatars';
import '../../styles/game.css';

export interface AvatarRingSeat {
  id: string;
  avatar: AvatarId;
}

export interface AvatarRingProps {
  seats: AvatarRingSeat[];
  mood?: AvatarMood;
  animate?: AvatarAnimation;
  /** Avatar size in px. */
  size?: number;
  /** Distance from the centre to each avatar's centre, in px. */
  radius?: number;
  className?: string;
  children?: ReactNode;
}

export function AvatarRing({ seats, mood = 'idle', animate = 'none', size = 48, radius = 124, className = '', children }: AvatarRingProps) {
  const n = Math.max(1, seats.length);
  const box = radius * 2 + size;
  const style = { '--ar-size': `${box}px`, '--av-size': `${size}px` } as CSSProperties;
  return (
    <div className={`avatar-ring ${className}`.trim()} style={style}>
      <div className="avatar-ring__centre">{children}</div>
      <ul className="avatar-ring__seats" aria-hidden="true">
        {seats.map((s, i) => {
          const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
          const dx = Math.round(Math.cos(a) * radius);
          const dy = Math.round(Math.sin(a) * radius);
          const seatStyle = {
            left: `calc(50% + ${dx}px)`,
            top: `calc(50% + ${dy}px)`,
            animationDelay: `${i * 60}ms`,
          } as CSSProperties;
          return (
            <li key={s.id} className="avatar-ring__seat anim-pop-in" style={seatStyle}>
              <Avatar id={s.avatar} size={size} mood={mood} animate={animate} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
