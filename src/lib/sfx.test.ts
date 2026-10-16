/**
 * sfx.ts gating: silent unless enabled AND the shared context is unlocked; never throws, with or
 * without WebAudio; never piles up more than MAX_CUES cues at once. The AudioContext is a hand-rolled
 * fake (vitest runs in node, which has no WebAudio) that records the nodes each cue schedules.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const audioMock = vi.hoisted(() => ({ ctx: null as unknown as AudioContext | null, calls: 0 }));
vi.mock('./audio', () => ({
  getAudioContext: () => {
    audioMock.calls++;
    return audioMock.ctx;
  },
}));

import { MAX_CUES, __resetSfxForTests, haptic, isSfxEnabled, playSfx, setSfxEnabled, type SfxName } from './sfx';

const ALL_CUES: SfxName[] = ['tap', 'pop', 'whoosh', 'reveal', 'tick', 'drumroll', 'tada', 'womp', 'unmask'];

interface FakeContext {
  ctx: AudioContext;
  sources: Array<{ started: number[]; stopped: number[] }>;
  resumed: number;
  setTime(t: number): void;
}

function fakeParam() {
  return {
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

function fakeNode(extra: Record<string, unknown> = {}) {
  return { connect: vi.fn(), disconnect: vi.fn(), ...extra };
}

function makeContext(opts: { state?: AudioContextState; throwOnOscillator?: boolean } = {}): FakeContext {
  const sources: FakeContext['sources'] = [];
  let currentTime = 0;
  const makeSource = (extra: Record<string, unknown> = {}) => {
    const record = { started: [] as number[], stopped: [] as number[] };
    sources.push(record);
    return fakeNode({
      ...extra,
      onended: null,
      start: vi.fn((t: number) => record.started.push(t)),
      stop: vi.fn((t: number) => record.stopped.push(t)),
    });
  };
  const fake = {
    state: opts.state ?? 'running',
    sampleRate: 48000,
    destination: fakeNode(),
    resume: vi.fn(() => {
      ctxWrap.resumed++;
      return Promise.resolve();
    }),
    createGain: vi.fn(() => fakeNode({ gain: fakeParam() })),
    createBiquadFilter: vi.fn(() => fakeNode({ type: 'lowpass', Q: fakeParam(), frequency: fakeParam() })),
    createOscillator: vi.fn(() => {
      if (opts.throwOnOscillator) throw new Error('boom');
      return makeSource({ type: 'sine', frequency: fakeParam() });
    }),
    createBufferSource: vi.fn(() => makeSource({ buffer: null, loop: false })),
    createBuffer: vi.fn((_ch: number, length: number) => ({ getChannelData: () => new Float32Array(length) })),
  };
  Object.defineProperty(fake, 'currentTime', { get: () => currentTime });
  const ctxWrap: FakeContext = {
    ctx: fake as unknown as AudioContext,
    sources,
    resumed: 0,
    setTime: (t) => {
      currentTime = t;
    },
  };
  return ctxWrap;
}

beforeEach(() => {
  __resetSfxForTests();
  audioMock.ctx = null;
  audioMock.calls = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sfx without WebAudio (node)', () => {
  it('is disabled by default and mirrors setSfxEnabled', () => {
    expect(isSfxEnabled()).toBe(false);
    setSfxEnabled(true);
    expect(isSfxEnabled()).toBe(true);
    setSfxEnabled(false);
    expect(isSfxEnabled()).toBe(false);
  });

  it('the real audio module reports no context outside a browser', async () => {
    const real = await vi.importActual<typeof import('./audio')>('./audio');
    expect(real.getAudioContext()).toBeNull();
    expect(() => real.unlockAudio()).not.toThrow();
    expect(real.getAudioContext()).toBeNull();
  });

  it('every cue is a safe no-op when disabled, and when enabled without an unlocked context', () => {
    for (const name of ALL_CUES) expect(() => playSfx(name)).not.toThrow();
    expect(audioMock.calls).toBe(0); // disabled: the context is not even consulted
    setSfxEnabled(true);
    for (const name of ALL_CUES) expect(() => playSfx(name)).not.toThrow();
    expect(audioMock.calls).toBe(ALL_CUES.length);
  });

  it('haptic never throws without navigator.vibrate', () => {
    vi.stubGlobal('navigator', {});
    expect(() => haptic()).not.toThrow();
    expect(() => haptic('success')).not.toThrow();
    vi.stubGlobal('navigator', undefined);
    expect(() => haptic('warning')).not.toThrow();
  });
});

describe('sfx on an unlocked context', () => {
  it('schedules nothing while disabled even with a context', () => {
    const fake = makeContext();
    audioMock.ctx = fake.ctx;
    playSfx('tada');
    expect(fake.sources).toHaveLength(0);
  });

  it('schedules each cue (at most 1 s) and starts every source slightly in the future', () => {
    const fake = makeContext();
    audioMock.ctx = fake.ctx;
    setSfxEnabled(true);
    for (const name of ALL_CUES) {
      __resetSfxForTests();
      setSfxEnabled(true);
      fake.sources.length = 0;
      fake.setTime(10);
      playSfx(name);
      expect(fake.sources.length, name).toBeGreaterThan(0);
      for (const s of fake.sources) {
        expect(s.started, name).toHaveLength(1);
        expect(s.started[0], name).toBeGreaterThan(10);
        expect(s.stopped[0], name).toBeLessThanOrEqual(10 + 1 + 0.05);
      }
    }
  });

  it('routes everything through one master bus on the destination', () => {
    const fake = makeContext();
    audioMock.ctx = fake.ctx;
    setSfxEnabled(true);
    playSfx('tick');
    playSfx('pop');
    const createGain = (fake.ctx as unknown as { createGain: ReturnType<typeof vi.fn> }).createGain;
    const gains = createGain.mock.results.map((r) => r.value as { connect: ReturnType<typeof vi.fn> });
    const toDestination = gains.filter((g) => g.connect.mock.calls.some((c) => c[0] === fake.ctx.destination));
    expect(toDestination).toHaveLength(1);
  });

  it('drops cues beyond MAX_CUES until the earlier ones end', () => {
    const fake = makeContext();
    audioMock.ctx = fake.ctx;
    setSfxEnabled(true);
    fake.setTime(0);
    for (let i = 0; i < MAX_CUES + 3; i++) playSfx('tick');
    expect(fake.sources).toHaveLength(MAX_CUES);
    fake.setTime(5); // all ticks are long over
    playSfx('tick');
    expect(fake.sources).toHaveLength(MAX_CUES + 1);
  });

  it('tries to resume a suspended context', () => {
    const fake = makeContext({ state: 'suspended' });
    audioMock.ctx = fake.ctx;
    setSfxEnabled(true);
    playSfx('tap');
    expect(fake.resumed).toBe(1);
  });

  it('swallows errors thrown by the audio graph', () => {
    const fake = makeContext({ throwOnOscillator: true });
    audioMock.ctx = fake.ctx;
    setSfxEnabled(true);
    expect(() => playSfx('reveal')).not.toThrow();
    expect(() => playSfx('womp')).not.toThrow();
  });
});

describe('haptic', () => {
  it('vibrates a pattern per kind and swallows a throwing vibrate', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    haptic();
    haptic('medium');
    haptic('success');
    haptic('warning');
    expect(vibrate).toHaveBeenCalledTimes(4);
    const patterns = vibrate.mock.calls.map((c) => c[0] as number | number[]);
    expect(new Set(patterns.map((p) => JSON.stringify(p))).size).toBe(4);
    expect(Array.isArray(patterns[2])).toBe(true);
    vi.stubGlobal('navigator', {
      vibrate: () => {
        throw new Error('blocked');
      },
    });
    expect(() => haptic('light')).not.toThrow();
  });
});
