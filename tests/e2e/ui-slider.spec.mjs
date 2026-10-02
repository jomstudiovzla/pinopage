// FASE 5 : curseur Avant/Après, lightbox, filtres, calendrier.
import { test, expect } from '@playwright/test';

async function openHome(page) {
  await page.addInitScript(() => {
    try { localStorage.setItem('pino_cookie_consent', 'essential_only'); } catch (e) {}
  });
  await page.goto('/index.html');
  await page.waitForFunction(() => typeof window.openWindowModal === 'function' && !!window.PinoBaSlider);
}

test('réalisations : boutons Avant/Après déplacent le curseur et se désactivent aux extrémités', async ({ page }) => {
  await openHome(page);
  await page.evaluate(() => window.openWindowModal('realisations'));
  await expect(page.locator('#modal-window-realisations')).toHaveJSProperty('open', true);
  await expect(page.locator('#galerie-ba')).toBeVisible();

  const handle = page.locator('#slider-handle');
  const prev = page.locator('#galerie-ba-prev');
  const next = page.locator('#galerie-ba-next');
  await expect(prev).toBeEnabled();
  await expect(next).toBeEnabled();

  await next.click();
  await expect.poll(async () => handle.evaluate((el) => el.style.left)).toBe('100%');
  await expect(page.locator('#slider-resize')).toHaveCSS('width', /.*/);
  await expect.poll(async () => page.locator('#slider-resize').evaluate((el) => el.style.width)).toBe('100%');
  await expect(next).toBeDisabled();
  await expect(prev).toBeEnabled();
  await expect(page.locator('#galerie-ba-indicator')).toHaveText('100 %');

  await prev.click();
  await expect.poll(async () => handle.evaluate((el) => el.style.left)).toBe('0%');
  await expect(prev).toBeDisabled();
  await expect(next).toBeEnabled();
  await expect(page.locator('#galerie-ba-indicator')).toHaveText('0 %');
});

test('galerie : filtres + lightbox prev/next', async ({ page }) => {
  await openHome(page);
  await page.evaluate(() => window.openWindowModal('realisations'));
  await expect(page.locator('#modal-window-realisations')).toHaveJSProperty('open', true);

  const allCount = await page.locator('#gallery-grid .gallery-item:visible').count();
  expect(allCount).toBeGreaterThan(1);

  await page.locator('.gallery-filter', { hasText: 'Taille de Haies' }).click();
  const haieCount = await page.locator('#gallery-grid .gallery-item:visible').count();
  expect(haieCount).toBeGreaterThan(0);
  expect(haieCount).toBeLessThan(allCount);

  await page.locator('#gallery-grid .gallery-item:visible').first().click();
  await expect(page.locator('#gallery-modal')).toHaveJSProperty('open', true);
  const title1 = await page.locator('#lightbox-title').innerText();
  await expect(page.locator('#lightbox-next')).toBeEnabled();
  await page.locator('#lightbox-next').click();
  await expect.poll(async () => page.locator('#lightbox-title').innerText()).not.toBe(title1);
  await page.locator('#lightbox-prev').click();
  await expect.poll(async () => page.locator('#lightbox-title').innerText()).toBe(title1);
});

test('hub Réalisations : clic réel, clavier et glisser-déposer', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: /Nos Réalisations/ }).click();
  await expect(page.locator('#modal-window-realisations')).toHaveJSProperty('open', true);
  const slider = page.locator('#galerie-ba');
  await slider.focus();
  await page.keyboard.press('End');
  await expect.poll(async () => page.locator('#slider-handle').evaluate((el) => el.style.left)).toBe('100%');
  await page.keyboard.press('Home');
  await expect.poll(async () => page.locator('#slider-handle').evaluate((el) => el.style.left)).toBe('0%');

  const box = await slider.boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5, { steps: 8 });
  await page.mouse.up();
  const pct = await page.locator('#slider-handle').evaluate((el) => parseFloat(el.style.left));
  expect(pct).toBeGreaterThan(50);
  expect(pct).toBeLessThan(90);
});

test('calendrier : onglets saison + réservation ouvre le devis', async ({ page }) => {
  await openHome(page);
  await page.evaluate(() => window.openWindowModal('calendrier'));
  await expect(page.locator('#modal-window-realisations')).toHaveJSProperty('open', true);
  await expect(page.locator('#calendrier-jardinage')).toBeVisible();

  await expect(page.locator('#content-printemps')).toBeVisible();
  await expect(page.locator('#content-ete')).toBeHidden();

  await page.locator('#tab-ete').click();
  await expect(page.locator('#content-ete')).toBeVisible();
  await expect(page.locator('#content-printemps')).toBeHidden();
  await expect(page.locator('#tab-ete')).toHaveClass(/bg-brand-vivid/);

  await page.locator('#tab-hiver').click();
  await expect(page.locator('#content-hiver')).toBeVisible();

  await page.locator('#content-hiver button', { hasText: 'Réserver ce service' }).click();
  await expect(page.locator('#modal-window-devis')).toHaveJSProperty('open', true);
  await expect(page.locator('#details')).toHaveValue(/Élagage d'Hiver/);
});
