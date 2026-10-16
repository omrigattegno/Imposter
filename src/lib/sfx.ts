/**
 * Sound effects and haptics. STUB: the motion builder implements this with synthesized WebAudio
 * (no audio assets, works offline) on the shared AudioContext from ./audio.
 *
 * CONTRACT:
 *  - playSfx(name): fire-and-forget; silent unless setSfxEnabled(true) was called AND unlockAudio() ran
 *    in a user gesture. Never throws.
 *  - names: 'tap' (button press) | 'pop' (chip add/select) | 'whoosh' (pass / screen change) |
 *    'reveal' (card shown) | 'tick' (countdown 3-2-1) | 'drumroll' (results opening) | 'tada' (table wins)
 *    | 'womp' (imposter wins / caught) | 'unmask' (mask drops)
 *  - setSfxEnabled(on): mirrors settings.sounds (the GameProvider calls it).
 *  - haptic(kind): 'light' | 'medium' | 'success' | 'warning' via navigator.vibrate where available.
 */
export type SfxName = 'tap' | 'pop' | 'whoosh' | 'reveal' | 'tick' | 'drumroll' | 'tada' | 'womp' | 'unmask';
export type HapticKind = 'light' | 'medium' | 'success' | 'warning';

let enabled = false;

export function setSfxEnabled(on: boolean): void {
  enabled = on;
}

export function isSfxEnabled(): boolean {
  return enabled;
}

export function playSfx(_name: SfxName): void {}

export function haptic(_kind: HapticKind = 'light'): void {}
