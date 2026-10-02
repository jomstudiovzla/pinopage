// Flux métier réels : demande de devis, coupon validé par la base, cloisonnement, absence de démo.
import { test, expect } from '@playwright/test';
import { resetEmulators, createUser, dbGet, dbSet, openSite, loginWithPassword, firebaseUser } from './helpers.mjs';

const PASS = 'Jardin-2026!';

test.beforeEach(async () => { await resetEmulators(); });

test('visiteur : demande de devis enregistrée en base (sans compte)', async ({ page }) => {
  await openSite(page);
  await page.evaluate(() => window.openWindowModal('devis'));
  await page.fill('#postal-code', '84320 Entraigues-sur-la-Sorgue');
  await page.fill('#budget', '400');
  await page.fill('#email', 'visiteur@example.com');
  await page.fill('#name', 'Visiteur Test');
  await page.fill('#details', 'Taille de haie 20 m');
  await page.locator('#devis-form input[type="checkbox"][required]').check();
  await page.locator('#submit-btn').click();
  await expect.poll(async () => {
    const leads = (await dbGet('leads')) || {};
    return Object.values(leads).filter((l) => l.email === 'visiteur@example.com').length;
  }).toBe(1);
  const lead = Object.values(await dbGet('leads')).find((l) => l.email === 'visiteur@example.com');
  expect(lead.status).toBe('new');
  // Le visiteur n'a pas pu écrire dans un dossier client.
  expect(await dbGet('clients_records/visiteur@example_com')).toBeNull();
});

test('coupon : code du titulaire validé par la base, code falsifié refusé', async ({ page }) => {
  await createUser('alice@example.com', PASS);
  await openSite(page);
  await loginWithPassword(page, 'alice@example.com', PASS);
  await expect(page.locator('#modal-window-client')).toHaveJSProperty('open', true);
  const { uid } = await firebaseUser(page);
  await expect.poll(() => dbGet(`coupons/${uid}/codigo_cupon`)).toMatch(/^PINO-[A-Z0-9]{4,8}$/);
  const code = await dbGet(`coupons/${uid}/codigo_cupon`);
  await page.evaluate(() => { document.querySelectorAll('dialog[open]').forEach((d) => d.close()); window.openWindowModal('devis'); });

  // Code falsifié injecté dans le cache local : refusé (la base fait foi).
  await page.evaluate(() => {
    const u = JSON.parse(localStorage.getItem('pino_current_user'));
    u.promoCode = 'PINO-FAKE'; localStorage.setItem('pino_current_user', JSON.stringify(u));
  });
  await page.fill('#devis-coupon-input', 'PINO-FAKE');
  await page.evaluate(() => window.applyDevisCoupon());
  await expect(page.locator('#devis-coupon-feedback')).toContainText('ne correspond pas');
  expect(await page.evaluate(() => window._activeDevisCoupon)).toBeNull();

  // Vrai code : validé.
  await page.fill('#devis-coupon-input', code);
  await page.evaluate(() => window.applyDevisCoupon());
  await expect(page.locator('#devis-coupon-feedback')).toContainText('validé');
  expect(await page.evaluate(() => window._activeDevisCoupon.discountPct)).toBe(20);

  // Marqué utilisé par l'admin : plus accepté.
  await dbSet(`coupons/${uid}/estado`, 'used');
  await page.evaluate(() => window.applyDevisCoupon());
  await expect(page.locator('#devis-coupon-feedback')).toContainText('déjà été utilisé');
});

test('coupon : un client ne peut pas se donner -90 % depuis la console', async ({ page }) => {
  await createUser('alice@example.com', PASS);
  await openSite(page);
  await loginWithPassword(page, 'alice@example.com', PASS);
  await expect(page.locator('#modal-window-client')).toHaveJSProperty('open', true);
  const { uid } = await firebaseUser(page);
  await expect.poll(() => dbGet(`coupons/${uid}/descuento_pct`)).toBe(20);
  const result = await page.evaluate((id) => window.pinoRtdb.ref('coupons/' + id).update({ descuento_pct: 90 }).then(() => 'ok', (e) => e.code || 'denied'), uid);
  expect(result).not.toBe('ok');
  expect(await dbGet(`coupons/${uid}/descuento_pct`)).toBe(20);
});

test('cloisonnement : un client connecté ne lit ni les autres clients ni les leads', async ({ page }) => {
  await createUser('alice@example.com', PASS);
  await dbSet('leads/L2', { email: 'bob@example.com', status: 'new', source: 'web_devis', created_at: 'x' });
  await dbSet('users/uidB', { email: 'bob@example.com', role: 'client' });
  await openSite(page);
  await loginWithPassword(page, 'alice@example.com', PASS);
  await expect(page.locator('#modal-window-client')).toHaveJSProperty('open', true);
  const reads = await page.evaluate(async () => {
    const tryRead = (p) => window.pinoRtdb.ref(p).once('value').then(() => 'lu', () => 'refusé');
    return { users: await tryRead('users'), other: await tryRead('users/uidB'), leads: await tryRead('leads'), lead: await tryRead('leads/L2') };
  });
  expect(reads).toEqual({ users: 'refusé', other: 'refusé', leads: 'refusé', lead: 'refusé' });
});

test('client : ses devis déposés avant la création du compte apparaissent (requête filtrée)', async ({ page }) => {
  await dbSet('leads/OLD1', { email: 'alice@example.com', status: 'new', source: 'web_devis', created_at: '2026-09-01', service_type: 'Tonte' });
  await createUser('alice@example.com', PASS);
  await openSite(page);
  await loginWithPassword(page, 'alice@example.com', PASS);
  await expect(page.locator('#modal-window-client')).toHaveJSProperty('open', true);
  const quotes = await page.evaluate(() => window.PinoDB.fetchClientQuotes('alice@example.com'));
  expect(quotes.data.map((q) => q.id)).toContain('OLD1');
});

test('aucune donnée de démonstration dans le CRM admin', async ({ page }) => {
  await createUser('pino.espacesverts@gmail.com', PASS);
  await openSite(page);
  // Navigateur ayant encore les anciens exemples en cache : purgés au chargement suivant.
  await page.evaluate(() => localStorage.setItem('pino_leads', JSON.stringify([{ id: '#DEV-PINO-2026-8812', name: 'Jean-Christophe Bernard' }])));
  await page.reload();
  await page.waitForFunction(() => !!window.pinoAuth);
  await loginWithPassword(page, 'pino.espacesverts@gmail.com', PASS);
  await expect(page.locator('#modal-window-admin')).toHaveJSProperty('open', true);
  await page.waitForTimeout(1500);
  const html = await page.locator('#modal-window-admin').innerHTML();
  expect(html).not.toContain('Jean-Christophe');
  expect(html).not.toContain('Valérie Mercier');
  expect(html).not.toContain('Marc Delmas');
  const cached = await page.evaluate(() => localStorage.getItem('pino_leads') || '');
  expect(cached).not.toContain('DEV-PINO-2026-8812');
});

test('hors ligne : bandeau affiché puis masqué au retour du réseau', async ({ page, context }) => {
  await openSite(page);
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.locator('#offline-banner')).toBeVisible();
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('#offline-banner')).toBeHidden();
});
