/**
 * The avatar cast in the UI: every Setup row shows its player's character and the picker swaps them
 * (SET_AVATAR keeps the table unique), the ballot shows avatars, Results unmasks the Imposter's avatar,
 * and the Sound effects switch in Settings defaults to Off.
 */
import { expect, test, type Page } from '@playwright/test';
import {
  addPlayers,
  expectCardHidden,
  gotoHome,
  holdDown,
  holdUp,
  openSetup,
  PLAYERS,
  readSnapshot,
  seedSnapshot,
  waitForArmed,
} from './helpers';

const AVATAR_COUNT = 12;

/** data-avatar of every Setup row, in seating order. */
async function rowAvatars(page: Page): Promise<string[]> {
  const rows = page.getByTestId('player-avatar');
  const ids: string[] = [];
  for (let i = 0; i < (await rows.count()); i++) ids.push((await rows.nth(i).getAttribute('data-avatar')) ?? '');
  return ids;
}

test.describe('avatars', () => {
  test('Setup shows one character per player and the picker swaps them, keeping the table unique', async ({ page }) => {
    await gotoHome(page);
    await openSetup(page);
    await addPlayers(page, PLAYERS);

    const rows = page.getByTestId('player-avatar');
    await expect(rows).toHaveCount(PLAYERS.length);
    const before = await rowAvatars(page);
    expect(new Set(before).size).toBe(PLAYERS.length); // assigned by the store, all different
    for (let i = 0; i < PLAYERS.length; i++) {
      expect(before[i]).toMatch(/^[a-z]+$/);
      // The row draws the real character (not the placeholder person) with that id.
      const face = rows.nth(i).locator('svg[data-avatar]');
      await expect(face).toHaveAttribute('data-avatar', before[i]);
      await expect(face).not.toHaveAttribute('data-placeholder', 'true');
    }

    // Open the picker for the first seat: all twelve, the player's own checked, the others' taken.
    await rows.nth(0).click();
    const picker = page.getByTestId('avatar-picker');
    await expect(picker).toBeVisible();
    const options = picker.getByTestId('avatar-opt');
    await expect(options).toHaveCount(AVATAR_COUNT);
    const checked = picker.locator('[data-testid="avatar-opt"][aria-checked="true"]');
    await expect(checked).toHaveCount(1);
    await expect(checked).toHaveAttribute('data-avatar', before[0]);
    const taken = picker.locator('[data-testid="avatar-opt"][data-taken="true"]');
    await expect(taken).toHaveCount(PLAYERS.length - 1);
    for (const id of before.slice(1)) await expect(taken.filter({ has: page.locator(`svg[data-avatar="${id}"]`) })).toHaveCount(1);

    // Picking a taken character swaps the two players.
    await picker.locator(`[data-testid="avatar-opt"][data-avatar="${before[1]}"]`).click();
    await expect(picker).toHaveCount(0);
    await expect(rows.nth(0)).toHaveAttribute('data-avatar', before[1]);
    await expect(rows.nth(1)).toHaveAttribute('data-avatar', before[0]);
    expect(new Set(await rowAvatars(page)).size).toBe(PLAYERS.length);

    // Picking a free character just changes this player.
    await rows.nth(0).click();
    await expect(picker).toBeVisible();
    const free = picker.locator('[data-testid="avatar-opt"]:not([data-taken]):not([aria-checked="true"])');
    await expect(free).toHaveCount(AVATAR_COUNT - PLAYERS.length);
    const freeId = (await free.first().getAttribute('data-avatar')) ?? '';
    expect(freeId).not.toBe('');
    await free.first().click();
    await expect(picker).toHaveCount(0);
    await expect(rows.nth(0)).toHaveAttribute('data-avatar', freeId);
    await expect(rows.nth(1)).toHaveAttribute('data-avatar', before[0]);
    const after = await rowAvatars(page);
    expect(new Set(after).size).toBe(PLAYERS.length);

    // Persisted with the players, so the next launch keeps the choice.
    const players = (await readSnapshot(page))?.players as Array<{ avatar: string }> | undefined;
    expect(players?.map((p) => p.avatar)).toEqual(after);

    // Close without picking (backdrop / Escape) leaves everything as is.
    await rows.nth(2).click();
    await expect(picker).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(picker).toHaveCount(0);
    expect(await rowAvatars(page)).toEqual(after);
  });

  test('Settings: the Sound effects switch defaults to Off and turning it on persists', async ({ page }) => {
    await gotoHome(page);
    await openSetup(page);
    await page.getByTestId('setup-settings').click();
    await expect(page.getByTestId('settings-screen')).toBeVisible();

    const off = page.getByTestId('settings-sounds-off');
    const on = page.getByTestId('settings-sounds-on');
    await expect(off).toHaveAttribute('aria-checked', 'true');
    await expect(on).toHaveAttribute('aria-checked', 'false');
    expect(((await readSnapshot(page))?.settings as { sounds?: boolean } | undefined)?.sounds).toBe(false);

    await on.click();
    await expect(on).toHaveAttribute('aria-checked', 'true');
    await expect(off).toHaveAttribute('aria-checked', 'false');
    expect(((await readSnapshot(page))?.settings as { sounds?: boolean } | undefined)?.sounds).toBe(true);

    await page.reload();
    await expect(page.getByTestId('settings-screen').or(page.getByTestId('setup-screen')).or(page.getByTestId('home-screen'))).toBeVisible();
    expect(((await readSnapshot(page))?.settings as { sounds?: boolean } | undefined)?.sounds).toBe(true);
  });

  test('the ballot shows avatars and Results unmasks the Imposter', async ({ page }) => {
    test.setTimeout(90_000);
    await seedSnapshot(page, VOTE_SNAPSHOT);
    await expect(page.getByTestId('vote-screen')).toBeVisible();

    const avatars = new Map(VOTE_PLAYERS.map((p) => [p.id, p.avatar]));
    for (const voter of VOTE_PLAYERS) {
      await expect(page.getByTestId('pass-name')).toHaveText(voter.name);
      await waitForArmed(page);
      await holdDown(page);
      await expect(page.getByTestId('vote-ballot')).toBeVisible();
      const options = page.getByTestId('ballot-opt');
      await expect(options).toHaveCount(VOTE_PLAYERS.length - 1);
      for (let i = 0; i < VOTE_PLAYERS.length - 1; i++) {
        const opt = options.nth(i);
        const id = (await opt.getAttribute('data-player-id')) ?? '';
        expect(id).not.toBe(voter.id);
        await expect(opt.locator('svg[data-avatar]')).toHaveAttribute('data-avatar', avatars.get(id) ?? 'missing');
      }
      // Everyone but the Imposter votes for the Imposter; the Imposter picks the first other player.
      const target = voter.id === IMPOSTER.id ? VOTE_PLAYERS.find((p) => p.id !== IMPOSTER.id)!.id : IMPOSTER.id;
      await options.filter({ has: page.locator(`svg[data-avatar="${avatars.get(target)}"]`) }).click();
      await holdUp(page);
      await expectCardHidden(page);
      await page.getByTestId('vote-lock').click();
    }

    await expect(page.getByTestId('guess-screen')).toBeVisible();
    // The caught player's avatar is shown bare-faced on the Guess screen too.
    await expect(page.getByTestId('guess-screen').locator(`svg[data-avatar="${IMPOSTER.avatar}"]`).first()).toBeVisible();
    await page.getByTestId('guess-giveup').click();

    const results = page.getByTestId('results-screen');
    await expect(results).toBeVisible();
    const banner = page.getByTestId('results-banner');
    await expect(banner).toHaveAttribute('data-winner', 'table');
    const imposterFace = banner.locator(`svg[data-avatar="${IMPOSTER.avatar}"]`);
    await expect(imposterFace).toHaveCount(1);
    // The opening sequence drops the mask about half a second in.
    await expect(imposterFace).toHaveAttribute('data-unmasked', 'true');
    await expect(results).toHaveAttribute('data-stage', '2');
    // The table keeps its masks on, one seat per non-Imposter.
    const table = banner.locator('.results__table svg[data-avatar]');
    await expect(table).toHaveCount(VOTE_PLAYERS.length - 1);
    for (let i = 0; i < VOTE_PLAYERS.length - 1; i++) await expect(table.nth(i)).toHaveAttribute('data-unmasked', 'false');
    await expect(banner.locator(`.results__table svg[data-avatar="${IMPOSTER.avatar}"]`)).toHaveCount(0);
    await expect(page.getByTestId('confetti')).toHaveCount(1);
  });
});

/** Round 1 in English (hold mode), discussion over, nobody has voted yet. Players carry their characters. */
const VOTE_PLAYERS = [
  { id: 'p1', name: 'Alice', avatar: 'glow' },
  { id: 'p2', name: 'Bob', avatar: 'hoop' },
  { id: 'p3', name: 'Carol', avatar: 'fig' },
  { id: 'p4', name: 'Dan', avatar: 'jet' },
];
const IMPOSTER = VOTE_PLAYERS[2];
const VOTE_SNAPSHOT = {
  version: 1,
  phase: 'vote',
  players: VOTE_PLAYERS,
  settings: {
    language: 'en',
    wordLanguage: 'auto',
    categoryId: 'animals',
    imposterCount: 1,
    clueRounds: 1,
    discussionSeconds: 60,
    imposterSeesCategory: true,
    imposterGuess: true,
    revealMethod: 'hold',
    difficulty: 'normal',
    penalty: 'off',
    sounds: false,
  },
  scores: { p1: 0, p2: 0, p3: 0, p4: 0 },
  round: {
    number: 1,
    word: { word: 'Penguin', category: 'animals', difficulty: 1, aliases: [] },
    categoryId: 'animals',
    categoryName: 'Animals',
    order: ['p1', 'p2', 'p3', 'p4'],
    imposterIds: ['p3'],
    starterId: 'p1',
    config: { clueRounds: 1, discussionSeconds: 60, imposterSeesCategory: true, imposterGuess: true, penalty: 'off' },
    revealIndex: 3,
    clueRound: 1,
    clueTurn: 3,
    voteIndex: 0,
    votes: {},
    guess: null,
    outcome: null,
    discussionEndsAt: null,
  },
  history: [],
  usedWords: ['en:animals:Penguin'],
};
