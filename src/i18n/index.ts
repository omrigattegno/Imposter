import { useCallback } from 'react';
import type { Lang } from '../game/types';
import { useGameState } from '../game/store';
import { common } from './messages.common';
import { game } from './messages.game';
import { pregame } from './messages.pregame';

export type MessageKey = keyof typeof common.en | keyof typeof pregame.en | keyof typeof game.en;
type Params = Record<string, string | number>;

const messages: Record<Lang, Record<MessageKey, string>> = {
  en: { ...common.en, ...pregame.en, ...game.en },
  he: { ...common.he, ...pregame.he, ...game.he },
};

/**
 * First-strong isolate (U+2068 FSI ... U+2069 PDI) around a value interpolated into a Hebrew sentence.
 * Without it, two Latin-script values joined only by neutral punctuation ('{name}: „{guess}”') merge into
 * one LTR run and swap places visually. Numbers are left alone so '{n}/{max}' and '{current} מתוך {total}'
 * render unchanged; English templates need no isolation.
 */
const FSI = '\u2068';
const PDI = '\u2069';

export function translate(lang: Lang, key: MessageKey, params?: Params): string {
  const template = messages[lang][key] ?? messages.en[key] ?? key;
  if (!params) return template;
  const rtl = isRtl(lang);
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    if (!(k in params)) return `{${k}}`;
    const v = params[k];
    // Isolate string values in Hebrew templates, and Hebrew values (a word-pack name) anywhere.
    const isolate = typeof v === 'string' && (rtl || /[\u05D0-\u05EA]/.test(v));
    return isolate ? `${FSI}${v}${PDI}` : String(v);
  });
}

/** Language of a piece of text (a secret word) by its script, for lang/dir attributes. */
export function langOfText(text: string): Lang {
  return /[\u05D0-\u05EA]/.test(text) ? 'he' : 'en';
}

export function isRtl(lang: Lang): boolean {
  return lang === 'he';
}

export type Translate = (key: MessageKey, params?: Params) => string;

/** Translation hook bound to the current game language. */
export function useT(): Translate {
  const lang = useGameState().settings.language;
  return useCallback((key: MessageKey, params?: Params) => translate(lang, key, params), [lang]);
}

export function useLang(): Lang {
  return useGameState().settings.language;
}
