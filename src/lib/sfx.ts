/**
 * Sound effects and haptics: tiny synthesized WebAudio cues (no audio assets, works offline) on the
 * shared AudioContext from ./audio. unlockAudio() creates that context inside a tap; this module never
 * creates a second one.
 *
 * CONTRACT:
 *  - playSfx(name): fire-and-forget; silent unless setSfxEnabled(true) was called AND unlockAudio() ran
 *    in a user gesture. Never throws.
 *  - names: 'tap' (button press) | 'pop' (chip add/select) | 'whoosh' (pass / screen change) |
 *    'reveal' (card shown) | 'tick' (countdown 3-2-1) | 'drumroll' (results opening) | 'tada' (table wins)
 *    | 'womp' (imposter wins / caught) | 'unmask' (mask drops)
 *  - every cue is at most 1 s, mixed through one master bus at about -12 dBFS, and at most MAX_CUES cues
 *    sound at once (extra calls during that window are dropped, not queued).
 *  - setSfxEnabled(on): mirrors settings.sounds (the GameProvider calls it).
 *  - haptic(kind): 'light' | 'medium' | 'success' | 'warning' via navigator.vibrate where available
 *    (Android; iOS ignores it). Independent of the sound setting. Never throws.
 */
import { getAudioContext } from './audio';

export type SfxName = 'tap' | 'pop' | 'whoosh' | 'reveal' | 'tick' | 'drumroll' | 'tada' | 'womp' | 'unmask';
export type HapticKind = 'light' | 'medium' | 'success' | 'warning';

/** Master bus level: 0.25 ≈ -12 dBFS. Cue peaks below are relative to it. */
export const MASTER_LEVEL = 0.25;
/** Cues allowed to overlap; the rest are dropped so a tap storm never piles up voices. */
export const MAX_CUES = 4;
/** Longest cue in seconds (the drumroll); every cue returns its own length so tests can check the cap. */
export const MAX_CUE_SECONDS = 1;

const HAPTIC_PATTERNS: Record<HapticKind, number | number[]> = {
  light: 10,
  medium: 28,
  success: [14, 50, 22, 50, 36],
  warning: [48, 70, 48],
};

let enabled = false;
let bus: { ctx: AudioContext; gain: GainNode } | null = null;
let noise: { ctx: AudioContext; buffer: AudioBuffer } | null = null;
/** End times (context seconds) of the cues scheduled so far; pruned on every play. */
let inflight: number[] = [];

export function setSfxEnabled(on: boolean): void {
  enabled = on;
}

export function isSfxEnabled(): boolean {
  return enabled;
}

/** Test hook: forget the cached bus and the in-flight cues. */
export function __resetSfxForTests(): void {
  enabled = false;
  bus = null;
  noise = null;
  inflight = [];
}

/* ---------- building blocks ---------- */

/** One master gain per context, so every cue shares the same ceiling. */
function masterBus(ctx: AudioContext): GainNode {
  if (bus && bus.ctx === ctx) return bus.gain;
  const gain = ctx.createGain();
  gain.gain.value = MASTER_LEVEL;
  gain.connect(ctx.destination);
  bus = { ctx, gain };
  return gain;
}

/** One second of white noise, built once per context. */
function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noise && noise.ctx === ctx) return noise.buffer;
  const rate = ctx.sampleRate || 44100;
  const buffer = ctx.createBuffer(1, rate, rate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noise = { ctx, buffer };
  return buffer;
}

function disconnectOnEnd(source: AudioScheduledSourceNode, ...nodes: AudioNode[]): void {
  source.onended = () => {
    try {
      source.disconnect();
      for (const n of nodes) n.disconnect();
    } catch {
      /* ignore */
    }
  };
}

/** Click-free amplitude envelope: quick attack, hold, exponential release ending at `at + dur`. */
function envelope(gain: GainNode, at: number, dur: number, peak: number, attack = 0.005, release = 0.04): void {
  const g = gain.gain;
  const releaseAt = Math.max(at + attack, at + dur - release);
  g.setValueAtTime(0.0001, at);
  g.linearRampToValueAtTime(peak, at + attack);
  g.setValueAtTime(peak, releaseAt);
  g.exponentialRampToValueAtTime(0.0001, at + dur);
}

interface ToneSpec {
  at: number;
  dur: number;
  freq: number;
  /** Exponential glide to this frequency over `glide` seconds (default: the whole tone). */
  freqTo?: number;
  glide?: number;
  type?: OscillatorType;
  peak?: number;
  attack?: number;
  release?: number;
  /** Optional low-pass before the bus (tames squares/saws); `cutoffTo` sweeps it over the tone. */
  cutoff?: number;
  cutoffTo?: number;
  /** Extra low-pass sweep points as [offsetSeconds, hz] after the start value (womp's wah-wah). */
  cutoffPath?: Array<[number, number]>;
}

/** Schedule one oscillator voice. */
function tone(ctx: AudioContext, out: AudioNode, spec: ToneSpec): void {
  const { at, dur, freq, freqTo, type = 'sine', peak = 0.5, attack, release } = spec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (freqTo !== undefined) osc.frequency.exponentialRampToValueAtTime(freqTo, at + (spec.glide ?? dur));
  envelope(gain, at, dur, peak, attack, release);
  let head: AudioNode = osc;
  const extra: AudioNode[] = [gain];
  if (spec.cutoff !== undefined) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 1.1;
    lp.frequency.setValueAtTime(spec.cutoff, at);
    if (spec.cutoffTo !== undefined) lp.frequency.exponentialRampToValueAtTime(spec.cutoffTo, at + dur);
    if (spec.cutoffPath) {
      for (const [offset, hz] of spec.cutoffPath) lp.frequency.exponentialRampToValueAtTime(hz, at + offset);
    }
    head.connect(lp);
    head = lp;
    extra.push(lp);
  }
  head.connect(gain);
  gain.connect(out);
  disconnectOnEnd(osc, ...extra);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

interface HissSpec {
  at: number;
  dur: number;
  peak?: number;
  attack?: number;
  release?: number;
  filter: BiquadFilterType;
  freq: number;
  /** Sweep points as [offsetSeconds, hz] after the start value. */
  path?: Array<[number, number]>;
  q?: number;
}

/** Schedule one filtered-noise voice (whoosh, drum hits). */
function hiss(ctx: AudioContext, out: AudioNode, spec: HissSpec): void {
  const { at, dur, peak = 0.4, attack, release } = spec;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = spec.filter;
  filter.Q.value = spec.q ?? 0.8;
  filter.frequency.setValueAtTime(spec.freq, at);
  if (spec.path) {
    for (const [offset, hz] of spec.path) filter.frequency.exponentialRampToValueAtTime(hz, at + offset);
  }
  const gain = ctx.createGain();
  envelope(gain, at, dur, peak, attack, release);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(out);
  disconnectOnEnd(src, filter, gain);
  src.start(at);
  src.stop(at + dur + 0.02);
}

/* ---------- the cues (each returns its length in seconds) ---------- */

type Cue = (ctx: AudioContext, out: AudioNode, at: number) => number;

const CUES: Record<SfxName, Cue> = {
  // Short soft click: a falling triangle blip, barely a tick.
  tap(ctx, out, at) {
    tone(ctx, out, { at, dur: 0.05, freq: 1500, freqTo: 420, type: 'triangle', peak: 0.3, release: 0.025 });
    return 0.05;
  },
  // Bubbly blip: a sine rising fast, like a bubble popping.
  pop(ctx, out, at) {
    tone(ctx, out, { at, dur: 0.12, freq: 320, freqTo: 920, glide: 0.08, peak: 0.6, release: 0.05 });
    return 0.12;
  },
  // Filtered noise sweeping up then down: the phone being passed.
  whoosh(ctx, out, at) {
    hiss(ctx, out, {
      at,
      dur: 0.48,
      peak: 0.5,
      attack: 0.09,
      release: 0.18,
      filter: 'bandpass',
      freq: 320,
      path: [
        [0.22, 2600],
        [0.48, 520],
      ],
      q: 1.2,
    });
    return 0.48;
  },
  // Two-note chime (E5 -> B5) with a soft octave shimmer on the second note.
  reveal(ctx, out, at) {
    tone(ctx, out, { at, dur: 0.3, freq: 659.25, type: 'triangle', peak: 0.45, release: 0.12 });
    tone(ctx, out, { at: at + 0.15, dur: 0.5, freq: 987.77, type: 'triangle', peak: 0.45, release: 0.25 });
    tone(ctx, out, { at: at + 0.15, dur: 0.45, freq: 1975.5, peak: 0.1, release: 0.3 });
    return 0.65;
  },
  // One short high sine: 3-2-1.
  tick(ctx, out, at) {
    tone(ctx, out, { at, dur: 0.07, freq: 1046.5, peak: 0.5, release: 0.03 });
    return 0.07;
  },
  // Sixteen fast low-passed noise hits over 0.7 s, swelling towards the end.
  drumroll(ctx, out, at) {
    const hits = 16;
    const step = 0.044;
    for (let i = 0; i < hits; i++) {
      hiss(ctx, out, {
        at: at + i * step,
        dur: 0.036,
        peak: 0.22 + 0.4 * (i / (hits - 1)),
        attack: 0.003,
        release: 0.02,
        filter: 'lowpass',
        freq: 900 + 40 * i,
        q: 0.7,
      });
    }
    return hits * step;
  },
  // Bright rising arpeggio C5 E5 G5 C6, the last note held with a fifth on top.
  tada(ctx, out, at) {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const last = i === notes.length - 1;
      const start = at + i * 0.09;
      const dur = last ? 0.52 : 0.17;
      const release = last ? 0.3 : 0.06;
      tone(ctx, out, { at: start, dur, freq, type: 'triangle', peak: 0.42, release });
      tone(ctx, out, { at: start, dur, freq: freq * 2, peak: 0.12, release });
    });
    tone(ctx, out, { at: at + 0.27, dur: 0.5, freq: 1567.98, type: 'triangle', peak: 0.2, release: 0.3 });
    return 0.8;
  },
  // Descending wah-wah: two slightly detuned saws sliding an octave down under a bouncing low-pass.
  womp(ctx, out, at) {
    const wah: Array<[number, number]> = [
      [0.22, 320],
      [0.38, 1300],
      [0.55, 260],
      [0.72, 120],
    ];
    tone(ctx, out, {
      at,
      dur: 0.74,
      freq: 196,
      freqTo: 92,
      type: 'sawtooth',
      peak: 0.3,
      attack: 0.02,
      release: 0.18,
      cutoff: 1700,
      cutoffPath: wah,
    });
    tone(ctx, out, {
      at,
      dur: 0.74,
      freq: 198.5,
      freqTo: 93.5,
      type: 'sawtooth',
      peak: 0.22,
      attack: 0.02,
      release: 0.18,
      cutoff: 1500,
      cutoffPath: wah,
    });
    return 0.74;
  },
  // A slide down (the mask coming off) then a pop as it drops.
  unmask(ctx, out, at) {
    tone(ctx, out, { at, dur: 0.26, freq: 900, freqTo: 280, glide: 0.22, type: 'triangle', peak: 0.4, release: 0.08 });
    tone(ctx, out, { at: at + 0.27, dur: 0.12, freq: 300, freqTo: 950, glide: 0.08, peak: 0.6, release: 0.05 });
    return 0.39;
  },
};

/* ---------- public API ---------- */

export function playSfx(name: SfxName): void {
  try {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      // Resumes when the page still has sticky activation; otherwise the cue is silently dropped.
      void ctx.resume().catch(() => {});
    }
    const cue = CUES[name];
    if (!cue) return;
    const now = ctx.currentTime;
    inflight = inflight.filter((end) => end > now);
    if (inflight.length >= MAX_CUES) return;
    const at = now + 0.015;
    const length = cue(ctx, masterBus(ctx), at);
    inflight.push(at + Math.min(length, MAX_CUE_SECONDS));
  } catch {
    /* sound is a nicety; never break the game */
  }
}

export function haptic(kind: HapticKind = 'light'): void {
  try {
    if (typeof navigator === 'undefined') return;
    const nav = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean };
    if (typeof nav.vibrate !== 'function') return;
    nav.vibrate(HAPTIC_PATTERNS[kind] ?? HAPTIC_PATTERNS.light);
  } catch {
    /* unsupported, or blocked outside a user gesture */
  }
}
