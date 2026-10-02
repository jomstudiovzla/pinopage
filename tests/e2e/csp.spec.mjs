// CSP réelle (non contournée), sans émulateur : page, carte, manifeste, service worker.
import { test, expect } from '@playwright/test';

test('aucune violation CSP au chargement et carte Google Maps affichée', async ({ page }) => {
  const violations = [];
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
    try { localStorage.setItem('pino_cookie_consent', 'essential_only'); } catch (e) {}
  });
  page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) violations.push(m.text()); });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.openWindowModal('devis'));
  const map = page.locator('iframe[src*="maps.google.com"]').first();
  await map.scrollIntoViewIfNeeded();
  await expect(map).toBeVisible();
  await page.waitForTimeout(1500);
  const frame = await map.elementHandle().then((h) => h.contentFrame());
  expect(frame).not.toBeNull();
  expect([...violations, ...(await page.evaluate(() => window.__csp))]).toEqual([]);
});

test('CSP : pas de CDN Tailwind, pas de localhost, pas de unsafe-eval', async ({ page }) => {
  await page.goto('/index.html');
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).not.toContain('cdn.tailwindcss.com');
  expect(csp).not.toMatch(/localhost|127\.0\.0\.1/);
  expect(csp).not.toContain('unsafe-eval');
  expect(csp).not.toContain('formsubmit');
  expect(csp).not.toContain('web3forms');
  expect(csp).toContain("form-action 'self'");
  expect(csp).toContain('https://maps.google.com');
  expect(await page.locator('script[src*="cdn.tailwindcss"]').count()).toBe(0);
});

test('PWA : manifeste valide, icônes aux tailles déclarées, service worker actif', async ({ page, request }) => {
  const manifest = await (await request.get('/manifest.json')).json();
  expect(manifest.name).toBeTruthy();
  expect(manifest.display).toBe('standalone');
  for (const icon of manifest.icons) {
    const res = await request.get('/' + icon.src);
    expect(res.status(), icon.src).toBe(200);
    const buf = await res.body();
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    expect(`${w}x${h}`, icon.src).toBe(icon.sizes);
  }
  await page.goto('/index.html');
  const scope = await page.evaluate(() => navigator.serviceWorker.ready.then((r) => r.scope));
  expect(scope).toContain('localhost');
});

test('aucune ressource locale en 404', async ({ page }) => {
  const missing = [];
  page.on('response', (r) => { if (r.url().startsWith('http://localhost') && r.status() === 404) missing.push(r.url()); });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  expect(missing).toEqual([]);
});
