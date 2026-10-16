/**
 * Screenshot capture for human review. Not a test of behaviour (the default run ignores this file);
 * run with `npm run test:e2e:screenshots` after `npm run build`. PNGs go to ./screenshots (gitignored).
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  addPlayers,
  expectCardHidden,
  gotoHome,
  HEBREW,
  holdDown,
  holdUp,
  openSetup,
  otherThan,
  passReveal,
  PLAYERS,
  playClues,
  readCard,
  setRevealMethod,
  startRound,
  STATE_KEY,
  waitForArmed,
} from './helpers';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'screenshots');
mkdirSync(DIR, { recursive: true });

async function shot(page: Page, name: string, fullPage = false): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300); // let the entrance transitions settle
  await page.screenshot({ path: join(DIR, `${name}.png`), fullPage });
}

/**
 * Results opens with a ~1.15 s sequence (drumroll, banner + unmask, then the outcome with confetti or
 * the sad wobble); wait for the last stage and let the banner's bounce finish before capturing.
 */
async function waitForResultsOpening(page: Page): Promise<void> {
  await expect(page.getByTestId('results-screen')).toHaveAttribute('data-stage', '2', { timeout: 10_000 });
  await page.waitForTimeout(700);
}

test.describe.configure({ mode: 'serial' });

test('pregame screens, English and Hebrew', async ({ page }) => {
  await gotoHome(page);
  await shot(page, 'home-en');

  await page.getByTestId('home-howto').click();
  await expect(page.getByTestId('howto-screen')).toBeVisible();
  await shot(page, 'howto-en');
  await page.getByTestId('howto-done').click();

  await openSetup(page);
  await addPlayers(page, PLAYERS);
  await shot(page, 'setup-en');

  // The character picker for the first seat.
  await page.getByTestId('player-avatar').first().click();
  await expect(page.getByTestId('avatar-picker')).toBeVisible();
  await shot(page, 'setup-picker-en');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('avatar-picker')).toHaveCount(0);

  await page.getByTestId('setup-settings').click();
  await expect(page.getByTestId('settings-screen')).toBeVisible();
  await shot(page, 'settings-en');

  await page.getByTestId('settings-lang-he').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await shot(page, 'settings-he');

  await page.getByTestId('settings-back').click();
  await expect(page.getByTestId('setup-screen')).toBeVisible();
  await shot(page, 'setup-he');

  await page.getByTestId('setup-back').click();
  await expect(page.getByTestId('home-screen')).toBeVisible();
  await shot(page, 'home-he');

  await page.getByTestId('home-howto').click();
  await expect(page.getByTestId('howto-screen')).toBeVisible();
  await shot(page, 'howto-he');
});

test('in-round screens, English, hold mode', async ({ page }) => {
  await gotoHome(page);
  await openSetup(page);
  await setRevealMethod(page, 'hold');
  await addPlayers(page, PLAYERS);
  await startRound(page);

  await expect(page.getByTestId('pass-name')).toHaveText(PLAYERS[0]);
  await shot(page, 'pass-en');

  let imposter = '';
  let shotWord = false;
  let shotImposter = false;
  for (const name of PLAYERS) {
    await expect(page.getByTestId('pass-name')).toHaveText(name);
    await waitForArmed(page);
    await holdDown(page);
    const card = await readCard(page);
    if (card.kind === 'imposter') {
      imposter = name;
      if (!shotImposter) {
        await shot(page, 'reveal-imposter-en');
        shotImposter = true;
      }
    } else if (!shotWord) {
      await shot(page, 'reveal-word-en');
      shotWord = true;
    }
    await holdUp(page);
    await expectCardHidden(page);
    await passReveal(page);
  }
  expect(shotWord && shotImposter).toBe(true);

  await expect(page.getByTestId('clues-screen')).toBeVisible();
  await shot(page, 'clues-en');
  await playClues(page, PLAYERS.length, 2);

  await expect(page.getByTestId('discussion-screen')).toBeVisible();
  await shot(page, 'discussion-en');
  await page.getByTestId('discussion-vote').click();

  await expect(page.getByTestId('pass-name')).toHaveText(PLAYERS[0]);
  await shot(page, 'vote-pass-en');

  let shotBallot = false;
  for (const name of PLAYERS) {
    await expect(page.getByTestId('pass-name')).toHaveText(name);
    await waitForArmed(page);
    await holdDown(page);
    await expect(page.getByTestId('vote-ballot')).toBeVisible();
    const target = name === imposter ? otherThan(PLAYERS, imposter) : imposter;
    await page.getByTestId('ballot-opt').filter({ hasText: target }).click();
    if (!shotBallot) {
      await shot(page, 'vote-ballot-en');
      shotBallot = true;
    }
    await holdUp(page);
    await page.getByTestId('vote-lock').click();
  }

  await expect(page.getByTestId('guess-screen')).toBeVisible();
  await page.getByTestId('guess-input').fill('banana');
  await shot(page, 'guess-en');
  await page.getByTestId('guess-submit').click();

  await expect(page.getByTestId('results-screen')).toBeVisible();
  await waitForResultsOpening(page);
  await shot(page, 'results-en');
  await shot(page, 'results-en-full', true);
});

/** A persisted round in Hebrew with a 14-letter word (BRIEF: cards tested up to 14 characters) and a dare penalty. */
const HE_PLAYERS = [
  { id: 'p1', name: 'דנה' },
  { id: 'p2', name: 'יוסי' },
  { id: 'p3', name: 'נועה' },
  { id: 'p4', name: 'עומר' },
];
const HE_IMPOSTER = 'נועה';
const HE_WORD = 'אנדוקרינולוגית';
const HE_SNAPSHOT = {
  version: 1,
  phase: 'reveal',
  players: HE_PLAYERS,
  settings: {
    language: 'he',
    categoryId: 'professions',
    imposterCount: 1,
    clueRounds: 2,
    discussionSeconds: 60,
    imposterSeesCategory: true,
    imposterGuess: true,
    revealMethod: 'hold',
    difficulty: 'hard',
    penalty: 'dare',
  },
  scores: { p1: 1, p2: 1, p3: 3, p4: 1 },
  round: {
    number: 2,
    word: { word: HE_WORD, category: 'professions', difficulty: 3, aliases: ['אנדוקרינולוג'] },
    categoryId: 'professions',
    categoryName: 'מקצועות',
    order: ['p1', 'p2', 'p3', 'p4'],
    imposterIds: ['p3'],
    starterId: 'p2',
    config: { clueRounds: 2, discussionSeconds: 60, imposterSeesCategory: true, imposterGuess: true, penalty: 'dare' },
    revealIndex: 0,
    clueRound: 1,
    clueTurn: 0,
    voteIndex: 0,
    votes: {},
    guess: null,
    outcome: null,
  },
  history: [{ number: 1, word: 'רופא שיניים', categoryId: 'professions', imposterIds: ['p3'], winner: 'imposter' }],
  usedWords: ['he:professions:רופא שיניים', `he:professions:${HE_WORD}`],
};

test('in-round screens, Hebrew: long word card and results', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [STATE_KEY, JSON.stringify(HE_SNAPSHOT)]);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByTestId('reveal-screen')).toBeVisible();

  const names = HE_PLAYERS.map((p) => p.name);
  let shotWord = false;
  for (const name of names) {
    await expect(page.getByTestId('pass-name')).toHaveText(name);
    await waitForArmed(page);
    await holdDown(page);
    const card = await readCard(page);
    expect(card.text).toMatch(HEBREW);
    if (card.kind === 'word') {
      expect(card.text).toBe(HE_WORD);
      if (!shotWord) {
        await shot(page, 'reveal-word-he');
        shotWord = true;
      }
    } else {
      expect(name).toBe(HE_IMPOSTER);
    }
    await holdUp(page);
    await expectCardHidden(page);
    await passReveal(page);
  }

  await playClues(page, names.length, 2);
  await page.getByTestId('discussion-vote').click();
  for (const name of names) {
    await expect(page.getByTestId('pass-name')).toHaveText(name);
    await waitForArmed(page);
    await holdDown(page);
    await expect(page.getByTestId('vote-ballot')).toBeVisible();
    const target = name === HE_IMPOSTER ? otherThan(names, HE_IMPOSTER) : HE_IMPOSTER;
    await page.getByTestId('ballot-opt').filter({ hasText: target }).click();
    await holdUp(page);
    await page.getByTestId('vote-lock').click();
  }

  await expect(page.getByTestId('guess-screen')).toBeVisible();
  await page.getByTestId('guess-giveup').click();
  await expect(page.getByTestId('results-screen')).toBeVisible();
  await expect(page.getByTestId('results-word')).toHaveText(HE_WORD);
  await waitForResultsOpening(page);
  await shot(page, 'results-he');
  await shot(page, 'results-he-full', true);
});

/** Round 1 just finished in English; players carry their chosen characters. */
const EN_PLAYERS = [
  { id: 'p1', name: 'Alice', avatar: 'glow' },
  { id: 'p2', name: 'Bob', avatar: 'hoop' },
  { id: 'p3', name: 'Carol', avatar: 'fig' },
  { id: 'p4', name: 'Dan', avatar: 'jet' },
  { id: 'p5', name: 'Eve', avatar: 'kiwi' },
];
const EN_WORD = 'Penguin';
function resultsSnapshot(winner: 'table' | 'imposter') {
  const tableWin = winner === 'table';
  return {
    version: 1,
    phase: 'results',
    players: EN_PLAYERS,
    settings: {
      language: 'en',
      wordLanguage: 'auto',
      categoryId: 'animals',
      imposterCount: 1,
      clueRounds: 2,
      discussionSeconds: 60,
      imposterSeesCategory: true,
      imposterGuess: true,
      revealMethod: 'hold',
      difficulty: 'normal',
      penalty: 'dare',
      sounds: false,
    },
    scores: tableWin ? { p1: 2, p2: 1, p3: 3, p4: 1, p5: 1 } : { p1: 1, p2: 0, p3: 6, p4: 0, p5: 0 },
    round: {
      number: 2,
      word: { word: EN_WORD, category: 'animals', difficulty: 1, aliases: [] },
      categoryId: 'animals',
      categoryName: 'Animals',
      order: ['p1', 'p2', 'p3', 'p4', 'p5'],
      imposterIds: ['p3'],
      starterId: 'p2',
      config: { clueRounds: 2, discussionSeconds: 60, imposterSeesCategory: true, imposterGuess: true, penalty: 'dare' },
      revealIndex: 4,
      clueRound: 2,
      clueTurn: 4,
      voteIndex: 4,
      votes: tableWin
        ? { p1: 'p3', p2: 'p3', p3: 'p1', p4: 'p3', p5: 'p2' }
        : { p1: 'p2', p2: 'p1', p3: 'p1', p4: 'p2', p5: 'p4' },
      guess: tableWin ? 'Ostrich' : null,
      outcome: tableWin
        ? {
            tally: { p3: 3, p1: 1, p2: 1 },
            votedOutId: 'p3',
            tie: false,
            imposterCaught: true,
            guessCorrect: false,
            winner: 'table',
            points: { p1: 1, p2: 1, p3: 0, p4: 1, p5: 1 },
          }
        : {
            tally: { p1: 2, p2: 2, p4: 1 },
            votedOutId: null,
            tie: true,
            imposterCaught: false,
            guessCorrect: null,
            winner: 'imposter',
            points: { p1: 0, p2: 0, p3: 3, p4: 0, p5: 0 },
          },
      discussionEndsAt: null,
    },
    history: [{ number: 1, word: 'Giraffe', categoryId: 'animals', imposterIds: ['p1'], winner: tableWin ? 'table' : 'imposter' }],
    usedWords: ['en:animals:Giraffe', `en:animals:${EN_WORD}`],
  };
}

for (const winner of ['table', 'imposter'] as const) {
  test(`results, English, ${winner} wins (opening sequence landed, Imposter unmasked)`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [STATE_KEY, JSON.stringify(resultsSnapshot(winner))]);
    await page.reload();
    const results = page.getByTestId('results-screen');
    await expect(results).toBeVisible();
    await expect(page.getByTestId('results-banner')).toHaveAttribute('data-winner', winner);
    await waitForResultsOpening(page);
    await expect(page.getByTestId('results-banner').locator('svg[data-avatar="fig"]')).toHaveAttribute('data-unmasked', 'true');
    await shot(page, `results-${winner}-win`);
    await shot(page, `results-${winner}-win-full`, true);
  });
}
