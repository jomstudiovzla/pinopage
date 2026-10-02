// FASE 6 : toast XSS-safe, retry, pages 404 / 500.
import { test, expect } from '@playwright/test';

async function openHome(page) {
  await page.addInitScript(() => {
    try { localStorage.setItem('pino_cookie_consent', 'essential_only'); } catch (e) {}
  });
  await page.goto('/index.html');
  await page.waitForFunction(() => typeof window.PinoErrors === 'object' && typeof window.showNotificationToast === 'function');
}

test('toast : texte brut (pas d\'HTML injecté) + bouton Réessayer', async ({ page }) => {
  await openHome(page);
  await page.evaluate(() => {
    window.__retried = 0;
    window.showNotificationToast('<img src=x onerror="window.__xss=1">', 'error', 0, {
      onRetry: function () { window.__retried += 1; }
    });
  });
  const toast = page.locator('#app-notification-toast');
  await expect(toast).toBeVisible();
  await expect(toast.locator('img')).toHaveCount(0);
  await expect(toast).toContainText('<img src=x');
  const xss = await page.evaluate(() => window.__xss);
  expect(xss).toBeUndefined();
  await page.getByRole('button', { name: 'Réessayer' }).click();
  expect(await page.evaluate(() => window.__retried)).toBe(1);
});

test('PinoErrors.report réseau affiche le message FR et un id de corrélation', async ({ page }) => {
  await openHome(page);
  const corr = await page.evaluate(() => {
    const n = window.PinoErrors.report({ message: 'Failed to fetch' }, { context: 'e2e', duration: 0 });
    return n.correlationId;
  });
  expect(corr).toMatch(/^pino-/);
  const toast = page.locator('#app-notification-toast');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText(/réseau|connexion/i);
  await expect(toast).toHaveAttribute('data-corr', corr);
});

test('URL inconnue : page 404 française', async ({ page }) => {
  const res = await page.goto('/cette-page-nexiste-pas-pino-fase6');
  expect(res && res.status()).toBe(404);
  await expect(page.getByRole('heading', { name: /introuvable/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /accueil/i })).toBeVisible();
});

test('page 500 française disponible', async ({ page }) => {
  const res = await page.goto('/500.html');
  expect(res && res.status()).toBe(200);
  await expect(page.getByRole('heading', { name: /indisponible/i })).toBeVisible();
});

test('/admin sert le SPA (pas 404) et ouvre la connexion sans session', async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('pino_cookie_consent', 'essential_only'); } catch (e) {}
  });
  const res = await page.goto('/admin');
  expect(res && res.status()).toBe(200);
  await expect(page.locator('#modal-window-admin')).toHaveCount(1);
  await expect(page.locator('body')).not.toContainText(/Page introuvable/i);
  const decision = await page.evaluate(() => window.PinoAdmin.decideAdminRoute({
    pathname: '/admin',
    firebaseUser: null,
    isAdmin: false,
  }));
  expect(decision).toBe('login');
  await page.waitForFunction(() => {
    const m = document.getElementById('modal-window-auth');
    return m && m.open;
  }, null, { timeout: 15000 });
});

test('page 403 française disponible', async ({ page }) => {
  const res = await page.goto('/403.html');
  expect(res && res.status()).toBe(200);
  await expect(page.getByRole('heading', { name: /refus/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /accueil/i })).toBeVisible();
});

test('client simulé sur /admin → décision forbidden', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => window.PinoAdmin);
  const decision = await page.evaluate(() => window.PinoAdmin.decideAdminRoute({
    pathname: '/admin',
    firebaseUser: { uid: 'client-1' },
    isAdmin: false,
  }));
  expect(decision).toBe('forbidden');
});
