/**
 * Lightweight canvas confetti burst (own code, no library).
 *
 * CONTRACT:
 *  - <Confetti fire={boolean} colors?={string[]} /> inside a `position: relative` parent; it covers the
 *    parent (absolute, inset 0, pointer-events none) and never affects layout.
 *  - Each time `fire` turns true a burst of ~120 pieces plays for about 2.5 s, then the canvas clears.
 *    Turning `fire` false does not interrupt a burst in progress; unmounting cancels it.
 *  - Under prefers-reduced-motion nothing moves: while `fire` is true a static sparkle is shown instead.
 *  - data-testid="confetti", data-state="idle" | "burst" | "static".
 */
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import './Confetti.css';

export interface ConfettiProps {
  fire: boolean;
  colors?: string[];
  /** Pieces per burst (default 120). */
  count?: number;
  /** Burst length in ms (default 2500). */
  duration?: number;
  className?: string;
}

const DEFAULT_COLORS = ['#ffc857', '#7cd6ff', '#ff7eb6', '#c9b6ff', '#5ee6a8', '#ff5c7a', '#ffe66d'];

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vrot: number;
  /** Flutter phase: the piece's drawn width oscillates so it looks like it tumbles in 3D. */
  phase: number;
  color: string;
  shape: 0 | 1 | 2; // rect, circle, strip
}

function makePieces(count: number, width: number, height: number, colors: string[]): Piece[] {
  const pieces: Piece[] = [];
  // Two cannons low on each side firing up and inwards, so the confetti crosses the whole card.
  for (let i = 0; i < count; i++) {
    const fromLeft = i % 2 === 0;
    const angle = (fromLeft ? -70 : -110) * (Math.PI / 180) + (Math.random() - 0.5) * 0.9;
    const speed = height * (0.55 + Math.random() * 0.5);
    const size = 6 + Math.random() * 8;
    pieces.push({
      x: fromLeft ? width * 0.12 : width * 0.88,
      y: height * 0.95,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: size,
      h: size * (0.5 + Math.random() * 0.8),
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 12,
      phase: Math.random() * Math.PI * 2,
      color: colors[i % colors.length],
      shape: (i % 5 === 0 ? 1 : i % 7 === 0 ? 2 : 0) as Piece['shape'],
    });
  }
  return pieces;
}

export function Confetti({ fire, colors, count = 120, duration = 2500, className = '' }: ConfettiProps) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [bursting, setBursting] = useState(false);
  const palette = colors && colors.length > 0 ? colors : DEFAULT_COLORS;
  const paletteRef = useRef(palette);
  paletteRef.current = palette;

  useEffect(() => {
    if (!fire || reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || canvas.parentElement?.clientWidth || 320;
    const height = canvas.clientHeight || canvas.parentElement?.clientHeight || 320;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pieces = makePieces(count, width, height, paletteRef.current);
    const gravity = height * 0.9;
    const drag = 0.985;
    let raf = 0;
    let last = 0;
    let elapsed = 0;
    setBursting(true);

    const frame = (now: number) => {
      if (!last) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt * 1000;
      ctx.clearRect(0, 0, width, height);
      // Last 500 ms fade out, so the burst ends softly instead of vanishing.
      const fade = elapsed > duration - 500 ? Math.max(0, (duration - elapsed) / 500) : 1;
      let alive = 0;
      for (const p of pieces) {
        p.vy += gravity * dt;
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;
        p.phase += dt * 9;
        if (p.y > height + 20) continue;
        alive++;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        const flutter = 0.35 + 0.65 * Math.abs(Math.cos(p.phase));
        if (p.shape === 1) {
          ctx.beginPath();
          ctx.ellipse(0, 0, (p.w / 2) * flutter, p.w / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 2) {
          ctx.fillRect((-p.w * 1.6) / 2, (-p.h * 0.4) / 2, p.w * 1.6 * flutter, p.h * 0.4);
        } else {
          ctx.fillRect((-p.w * flutter) / 2, -p.h / 2, p.w * flutter, p.h);
        }
        ctx.restore();
      }
      if (elapsed < duration && alive > 0) {
        raf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, width, height);
        setBursting(false);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, width, height);
      setBursting(false);
    };
  }, [fire, reduced, count, duration]);

  if (reduced) {
    if (!fire) return null;
    return (
      <div className={`confetti confetti--static ${className}`.trim()} aria-hidden="true" data-testid="confetti" data-state="static">
        <svg className="confetti__sparkle" viewBox="0 0 120 120" focusable="false">
          <path d="M60 8 L68 48 L108 60 L68 72 L60 112 L52 72 L12 60 L52 48 Z" fill={palette[0]} />
          <path d="M22 18 L26 32 L40 36 L26 40 L22 54 L18 40 L4 36 L18 32 Z" fill={palette[1 % palette.length]} />
          <path d="M98 76 L101 86 L111 89 L101 92 L98 102 L95 92 L85 89 L95 86 Z" fill={palette[2 % palette.length]} />
          <circle cx="92" cy="26" r="5" fill={palette[3 % palette.length]} />
          <circle cx="28" cy="96" r="4" fill={palette[4 % palette.length]} />
        </svg>
      </div>
    );
  }
  return (
    <canvas
      ref={canvasRef}
      className={`confetti ${className}`.trim()}
      aria-hidden="true"
      data-testid="confetti"
      data-state={bursting ? 'burst' : 'idle'}
    />
  );
}
