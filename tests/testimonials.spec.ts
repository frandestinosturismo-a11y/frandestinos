import { test, expect } from '@playwright/test';

test('testimonial ribbon moves, pauses and wraps without losing stories', async ({ page }) => {
  await page.goto('/');
  const ribbon = page.locator('.review-carousel');
  await ribbon.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(page.locator('.review-set:not(.review-copy) .review-card')).toHaveCount(7);
  await expect(page.locator('.review-copy')).toHaveAttribute('aria-hidden', 'true');
  const position = () => ribbon.evaluate(el => el.scrollLeft);
  const start = await position();
  await expect.poll(position).toBeGreaterThan(start + 5);
  await page.getByRole('button', { name: 'Pausar movimento' }).click();
  const paused = await position();
  await page.waitForTimeout(200);
  expect(await position()).toBe(paused);
  await ribbon.evaluate(el => { el.scrollLeft = (el.querySelector('.review-set') as HTMLElement).offsetWidth - 2; });
  await page.getByRole('button', { name: 'Retomar movimento' }).click();
  await expect.poll(position).toBeLessThan(100);
  const sizes = await ribbon.evaluate(el => ({ viewport: el.clientWidth, card: el.querySelector('.review-card')!.getBoundingClientRect().width }));
  if (page.viewportSize()!.width > 1100) expect(Math.round(sizes.card * 4 + 72)).toBe(sizes.viewport);
});

test('reduced motion starts paused and keyboard can explore the stories', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const ribbon = page.locator('.review-carousel');
  await ribbon.scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Retomar movimento' })).toBeVisible();
  const start = await ribbon.evaluate(el => el.scrollLeft);
  await page.waitForTimeout(200);
  expect(await ribbon.evaluate(el => el.scrollLeft)).toBe(start);
  await ribbon.focus();
  await page.keyboard.press('ArrowRight');
  expect(await ribbon.evaluate(el => el.scrollLeft)).toBeGreaterThan(start);
});
