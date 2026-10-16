import { STORAGE_KEY_LAST_PLAYERS, STORAGE_KEY_SETTINGS, STORAGE_KEY_STATE } from './constants';
import { isGameState, sanitizeSettings, upgradeState, DEFAULT_SETTINGS } from './engine';
import type { GameState, Settings } from './types';

function safeGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null): void {
  try {
    if (value === null) globalThis.localStorage?.removeItem(key);
    else globalThis.localStorage?.setItem(key, value);
  } catch {
    /* storage full or blocked: play on without persistence */
  }
}

export function saveSnapshot(state: GameState): void {
  safeSet(STORAGE_KEY_STATE, JSON.stringify(state));
  safeSet(STORAGE_KEY_SETTINGS, JSON.stringify(state.settings));
  if (state.players.length) {
    safeSet(STORAGE_KEY_LAST_PLAYERS, JSON.stringify(state.players.map((p) => (p.avatar ? { name: p.name, avatar: p.avatar } : { name: p.name }))));
  }
}

export function loadSnapshot(): GameState | null {
  const raw = safeGet(STORAGE_KEY_STATE);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isGameState(parsed)) return null;
    // Fields added after the snapshot was written (discussionEndsAt, benched) are filled in.
    return upgradeState({ ...parsed, settings: sanitizeSettings({ ...DEFAULT_SETTINGS, ...parsed.settings }) });
  } catch {
    return null;
  }
}

export function clearSnapshot(): void {
  safeSet(STORAGE_KEY_STATE, null);
}

export interface LastPlayer {
  name: string;
  avatar?: string;
}

/** Last game's players (names + avatars). Entries written by older builds are plain name strings. */
export function loadLastPlayers(): LastPlayer[] {
  const raw = safeGet(STORAGE_KEY_LAST_PLAYERS);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: LastPlayer[] = [];
    for (const x of parsed) {
      if (typeof x === 'string') out.push({ name: x });
      else if (x && typeof x === 'object' && typeof (x as LastPlayer).name === 'string') {
        const avatar = (x as LastPlayer).avatar;
        out.push(typeof avatar === 'string' ? { name: (x as LastPlayer).name, avatar } : { name: (x as LastPlayer).name });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function loadSavedSettings(): Settings | null {
  const raw = safeGet(STORAGE_KEY_SETTINGS);
  if (!raw) return null;
  try {
    return sanitizeSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) });
  } catch {
    return null;
  }
}

/** Device language -> app language (Hebrew if the device is Hebrew, else English). */
export function detectLanguage(): Settings['language'] {
  const langs = globalThis.navigator?.languages ?? [globalThis.navigator?.language ?? 'en'];
  return langs.some((l) => typeof l === 'string' && l.toLowerCase().startsWith('he')) ? 'he' : 'en';
}
