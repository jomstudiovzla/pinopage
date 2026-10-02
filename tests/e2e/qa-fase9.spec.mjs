// FASE 9 — trous de couverture (mail fail/retry, RTDB, formulaires, incognito, swipe).
// Le Worker de prod n'est jamais appelé : stub dans openSite / stubMailWorker.
import { test, expect } from '@playwright/test';
import {
  resetEmulators, createUser, dbGet, dbSet, openSite, stubMailWorker,
  loginWithPassword, firebaseUser, cachedSession, submitVisitorDevis,
  mailQueue, mailOutboxLocal,
} from './helpers.mjs';

const PASS = 'Jardin-2026!';

test.beforeEach(async () => { await resetEmulators(); });

test('QA-05 : Worker mail 503 → devis enregistré, file locale remplie', async ({ page }) => {
  await openSite(page, { mail: 'fail' });
  await submitVisitorDevis(page, { email: 'qa05@example.com' });
  await expect.poll(async () => {
    const leads = (await dbGet('leads')) || {};
    return Object.values(leads).filter((l) => l.email === 'qa05@example.com').length;
  }).toBe(1);
  await expect.poll(async () => {
    const q = await mailQueue(page);
    const o = await mailOutboxLocal(page);
    return q.length + o.length;
  }).toBeGreaterThan(0);
  const lead = Object.values(await dbGet('leads')).find((l) => l.email === 'qa05@example.com');
  expect(lead.status).toBe('new');
  expect(lead.source).toBe('web_devis');
});

test('QA-06 : après 503, Worker 200 + flush → files locales vides', async ({ page }) => {
  await openSite(page, { mail: 'fail' });
  await submitVisitorDevis(page, { email: 'qa06@example.com' });
  await expect.poll(async () => {
    const q = await mailQueue(page);
    const o = await mailOutboxLocal(page);
    return q.length + o.length;
  }).toBeGreaterThan(0);

  await stubMailWorker(page, { status: 200, delayMs: 0 });
  // enqueueMailJob est fire-and-forget : laisser Gmail-fallback échouer et écrire l'outbox.
  await page.evaluate(() => new Promise((r) => setTimeout(r, 600)));
  await page.evaluate(async () => {
    for (let i = 0; i < 8; i++) {
      if (window.PinoMail && typeof window.PinoMail.flushQueue === 'function') {
        await window.PinoMail.flushQueue();
      }
      if (window.PinoDB && typeof window.PinoDB.drainMailOutbox === 'function') {
        await window.PinoDB.drainMailOutbox();
      }
      let q = [];
      let o = [];
      try { q = JSON.parse(localStorage.getItem('pino_mail_queue') || '[]'); } catch (e) {}
      try { o = JSON.parse(localStorage.getItem('pino_mail_outbox') || '[]'); } catch (e) {}
      if (q.length + o.length === 0) return;
      await new Promise((r) => setTimeout(r, 250));
    }
  });
  await expect.poll(async () => {
    const q = await mailQueue(page);
    const o = await mailOutboxLocal(page);
    return q.length + o.length;
  }).toBe(0);
});

test('QA-18 : client ne peut pas muter un lead (status) ni écrire mail_outbox', async ({ page }) => {
  await createUser('alice@example.com', PASS);
  await dbSet('leads/QA18', {
    email: 'alice@example.com',
    status: 'new',
    source: 'web_devis',
    created_at: '2026-10-01T00:00:00.000Z',
  });
  await openSite(page);
  await loginWithPassword(page, 'alice@example.com', PASS);
  await expect(page.locator('#modal-window-client')).toHaveJSProperty('open', true);

  const writes = await page.evaluate(async () => {
    const tryWrite = (p, payload) =>
      window.pinoRtdb.ref(p).update(payload).then(() => 'ok', (e) => e.code || 'denied');
    return {
      status: await tryWrite('leads/QA18', { status: 'won' }),
      source: await tryWrite('leads/QA18', { source: 'hack' }),
      outbox: await window.pinoRtdb.ref('mail_outbox').push().set({
        status: 'queued', created_at: new Date().toISOString(), to: 'x@y.z',
      }).then(() => 'ok', (e) => e.code || 'denied'),
    };
  });
  expect(writes.status).not.toBe('ok');
  expect(writes.source).not.toBe('ok');
  expect(writes.outbox).not.toBe('ok');
  expect(await dbGet('leads/QA18/status')).toBe('new');
  expect(await dbGet('leads/QA18/source')).toBe('web_devis');
});

test('QA-16 : client connecté sur /admin → 403', async ({ page }) => {
  await createUser('alice@example.com', PASS);
  await openSite(page);
  await loginWithPassword(page, 'alice@example.com', PASS);
  await expect(page.locator('#modal-window-client')).toHaveJSProperty('open', true);
  await page.goto('/admin');
  await expect(page).toHaveURL(/403/);
  await expect(page.getByRole('heading', { name: /refus/i })).toBeVisible();
});

test('QA-22 : devis sans téléphone ni e-mail + mot de passe < 8', async ({ page }) => {
  await openSite(page);
  await page.evaluate(() => window.openWindowModal('devis'));
  await page.fill('#postal-code', '84320 Entraigues-sur-la-Sorgue');
  await page.fill('#budget', '400');
  await page.fill('#name', 'Sans Contact');
  await page.fill('#details', 'Tonte');
  await page.fill('#email', '');
  await page.fill('#phone', '');
  await page.locator('#devis-form input[type="checkbox"][required]').check();
  await page.locator('#submit-btn').click();
  await expect(page.locator('#contact-validation-msg')).toBeVisible();
  expect(await dbGet('leads')).toBeNull();

  await page.evaluate(() => {
    const devis = document.getElementById('modal-window-devis');
    if (devis && devis.open) devis.close();
    if (typeof window.openRegisterModal === 'function') window.openRegisterModal();
    else {
      window.openLoginModal();
      window.switchAuthTab('register');
    }
  });
  await expect(page.locator('#auth-view-register')).toBeVisible();
  await page.evaluate(() => {
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    set('reg-fullname', 'Claire Court');
    set('reg-email', 'court@example.com');
    set('reg-password', 'court');
    set('reg-password-confirm', 'court');
  });
  await page.locator('#auth-view-register form').evaluate((form) => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await expect(page.locator('#reg-error-msg:not(.hidden)')).toBeVisible();
  await expect(page.locator('#reg-error-text')).toContainText(/8 caractères/i);
  expect(await firebaseUser(page)).toBeNull();
});

test('QA-21 : clavier Tab (devis) + flèches (slider)', async ({ page }) => {
  await openSite(page);
  await page.evaluate(() => window.openWindowModal('devis'));
  await page.locator('#phone').focus();
  await page.keyboard.press('Tab');
  const afterTab = await page.evaluate(() => document.activeElement && document.activeElement.id);
  expect(afterTab).toBe('email');

  await page.keyboard.press('Escape');
  await page.evaluate(() => window.openWindowModal('realisations'));
  const slider = page.locator('#galerie-ba');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  const pct = await page.locator('#slider-handle').evaluate((el) => parseFloat(el.style.left) || 0);
  expect(pct).toBeGreaterThan(0);
});

test('QA-20 : swipe tactile sur le curseur Avant/Après', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Swipe mobile uniquement.');
  await openSite(page);
  await page.evaluate(() => window.openWindowModal('realisations'));
  const slider = page.locator('#galerie-ba');
  await expect(slider).toBeVisible();
  const box = await slider.boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5, { steps: 10 });
  await page.mouse.up();
  const pct = await page.locator('#slider-handle').evaluate((el) => parseFloat(el.style.left));
  expect(pct).toBeGreaterThan(50);
});

test('QA-23 : Worker lent (2,5 s) → devis quand même enregistré', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Délai réseau volontaire : Chromium uniquement (timeout WebKit).');
  await openSite(page, { mailDelayMs: 2500 });
  await submitVisitorDevis(page, { email: 'qa23@example.com' });
  await expect.poll(async () => {
    const leads = (await dbGet('leads')) || {};
    return Object.values(leads).filter((l) => l.email === 'qa23@example.com').length;
  }).toBe(1);
});

test('QA-24 : contexte vide (incognito) → accueil sans session', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await openSite(page);
  expect(await cachedSession(page)).toBeNull();
  expect(await firebaseUser(page)).toBeNull();
  await expect(page.locator('#nav-auth-text')).toContainText('Connexion');
  await expect(page.locator('#nav-session-chip')).not.toHaveClass(/pino-on/);
  await context.close();
});

test('session header : chip client visible après login', async ({ page, isMobile }) => {
  await createUser('alice@example.com', PASS);
  await openSite(page);
  await loginWithPassword(page, 'alice@example.com', PASS);
  await expect(page.locator('#modal-window-client')).toHaveJSProperty('open', true);
  if (isMobile) {
    await expect(page.locator('#mobile-session-chip')).toHaveClass(/pino-on/);
  } else {
    await expect(page.locator('#nav-auth-btn')).toHaveAttribute('aria-label', /Session client active/i);
    await expect(page.locator('#nav-auth-text')).toContainText(/Connecté/i);
  }
});
