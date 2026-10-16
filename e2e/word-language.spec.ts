import { expect, test } from '@playwright/test';
import { addPlayers, gotoHome, HEBREW, openSetup, PLAYERS, revealAllHold, startRound } from './helpers';

test.describe('word language', () => {
  test('English app with Hebrew words: Hebrew categories and cards, no category for word holders', async ({ page }) => {
    test.setTimeout(120_000);

    await gotoHome(page);
    await openSetup(page);
    await page.getByTestId('setup-settings').click();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await page.getByTestId('settings-reveal-hold').click();
    await page.getByTestId('settings-wordlang-he').click();
    await page.getByTestId('settings-back').click();

    // The app stays in English, the category chips are the Hebrew packs (incl. the Hebrew-only one).
    const setup = page.getByTestId('setup-screen');
    await expect(setup).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(setup).toContainText('ישראלי');
    await expect(setup).toContainText('Random');

    await addPlayers(page, PLAYERS);
    await startRound(page);

    await revealAllHold(page, PLAYERS, {
      lookTwice: false,
      onCard: async (card) => {
        const secret = page.getByTestId('secret-card');
        if (card.kind === 'word') {
          expect(card.text).toMatch(HEBREW);
          await expect(page.getByTestId('secret-word')).toHaveAttribute('dir', 'auto');
          await expect(secret).not.toContainText('Category');
        } else {
          // The Imposter still sees the category, named in the word language.
          await expect(secret).toContainText('Category:');
          await expect(secret).toContainText(HEBREW);
        }
      },
    });
    await expect(page.getByTestId('clues-screen')).toBeVisible();
  });
});
