// Outils partagés : pilotage direct des émulateurs Firebase (aucun mock de l'application).
import { expect } from '@playwright/test';

export const PROJECT = 'demo-pino';
const AUTH = 'http://127.0.0.1:9099';
const DB = 'http://127.0.0.1:9000';
const NS = `${PROJECT}-default-rtdb`;
const OWNER = { Authorization: 'Bearer owner' };

export async function resetEmulators() {
  await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: OWNER, body: 'null' });
}

export async function createUser(email, password, { verified = true, displayName } = {}) {
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!data.localId) throw new Error('signUp émulateur: ' + JSON.stringify(data));
  if (verified) {
    await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...OWNER },
      body: JSON.stringify({ localId: data.localId, emailVerified: true }),
    });
  }
  return data.localId;
}

export async function oobCodes(email, requestType) {
  const res = await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`);
  const { oobCodes: codes = [] } = await res.json();
  return codes.filter((c) => (!email || c.email === email) && (!requestType || c.requestType === requestType));
}

// Suit le lien de vérification envoyé « par e-mail » (comme un clic dans la boîte de réception).
export async function clickVerificationLink(email) {
  const [code] = (await oobCodes(email, 'VERIFY_EMAIL')).slice(-1);
  if (!code) throw new Error('aucun e-mail de vérification pour ' + email);
  const url = new URL(code.oobLink);
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:update?key=fake-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oobCode: url.searchParams.get('oobCode') }),
  });
  if (!res.ok) throw new Error('vérification refusée: ' + (await res.text()));
}

export async function dbGet(path) {
  const res = await fetch(`${DB}/${path}.json?ns=${NS}`, { headers: OWNER });
  return res.json();
}

export async function dbSet(path, value) {
  await fetch(`${DB}/${path}.json?ns=${NS}`, { method: 'PUT', headers: OWNER, body: JSON.stringify(value) });
}

const MAIL_HOST_RE = /pino-mail\.pinoespacesverts\.online/i;
const MAIL_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type,x-pino-correlation-id,authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

/**
 * Intercepte le Worker Resend : les e2e ne POSTent jamais la prod.
 * Double filet : page.route (Chromium) + wrap de window.fetch (WebKit keepalive
 * n'est pas toujours intercepté par Playwright).
 */
export async function stubMailWorker(page, opts = {}) {
  if (!page._pinoMailStub) page._pinoMailStub = { status: 200, delayMs: 0 };
  page._pinoMailStub.status = opts.status ?? (opts.fail ? 503 : 200);
  page._pinoMailStub.delayMs = opts.delayMs || 0;
  const snapshot = { status: page._pinoMailStub.status, delayMs: page._pinoMailStub.delayMs };

  try {
    await page.evaluate((s) => { window.__pinoMailStub = s; }, snapshot);
  } catch (e) { /* document pas encore chargé */ }

  if (!page._pinoMailInit) {
    page._pinoMailInit = true;
    await page.addInitScript((initial) => {
      window.__pinoMailStub = window.__pinoMailStub || initial;
      const orig = window.fetch.bind(window);
      window.fetch = function (input, init) {
        const url = typeof input === 'string'
          ? input
          : (input && typeof input.url === 'string' ? input.url : String(input));
        if (!/pino-mail/i.test(url)) return orig(input, init);
        const state = window.__pinoMailStub || initial || { status: 200, delayMs: 0 };
        const method = ((init && init.method)
          || (input && typeof input === 'object' && input.method)
          || 'GET').toUpperCase();
        const isGet = method === 'GET';
        const isOpt = method === 'OPTIONS';
        const status = isOpt ? 204 : (isGet ? 200 : (state.status || 200));
        const ok = status < 400;
        const body = isOpt ? null : JSON.stringify(
          isGet ? { status: 'ok' } : (ok ? { ok: true } : { ok: false, error: 'stub_fail' })
        );
        const headers = {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'content-type,x-pino-correlation-id,authorization',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        };
        const respond = () => new Response(body, { status, headers });
        const signal = (init && init.signal) || (input && input.signal);
        const delay = state.delayMs || 0;
        if (signal && signal.aborted) {
          return Promise.reject(new DOMException('Aborted', 'AbortError'));
        }
        if (!delay) return Promise.resolve(respond());
        return new Promise((resolve, reject) => {
          const t = setTimeout(() => resolve(respond()), delay);
          if (signal) {
            signal.addEventListener('abort', () => {
              clearTimeout(t);
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }
        });
      };
    }, snapshot);
  }

  if (page._pinoMailRouted) return;
  page._pinoMailRouted = true;
  await page.route(MAIL_HOST_RE, async (route) => {
    const state = page._pinoMailStub || { status: 200, delayMs: 0 };
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: MAIL_CORS });
      return;
    }
    if (state.delayMs) await new Promise((r) => setTimeout(r, state.delayMs));
    const isGet = route.request().method() === 'GET';
    const ok = isGet || state.status < 400;
    await route.fulfill({
      status: isGet ? 200 : state.status,
      contentType: 'application/json',
      headers: MAIL_CORS,
      body: JSON.stringify(isGet ? { status: 'ok' } : (ok ? { ok: true } : { ok: false, error: 'stub_fail' })),
    });
  });
}

export async function openSite(page, opts = {}) {
  const mailFail = opts.mail === 'fail' || opts.mail === 503;
  await stubMailWorker(page, {
    status: mailFail ? 503 : 200,
    delayMs: opts.mailDelayMs || 0,
  });
  await page.addInitScript(() => {
    try { localStorage.setItem('pino_cookie_consent', 'essential_only'); } catch (e) {}
  });
  await page.goto('/index.html?emulator=1');
  await page.waitForFunction(() => window.PINO_USE_EMULATOR === true && !!window.pinoAuth);
}

export async function submitVisitorDevis(page, { email = 'qa.fase9@example.com', name = 'QA Fase9' } = {}) {
  await page.evaluate(() => window.openWindowModal('devis'));
  await page.fill('#postal-code', '84320 Entraigues-sur-la-Sorgue');
  await page.fill('#budget', '400');
  await page.fill('#email', email);
  await page.fill('#name', name);
  await page.fill('#details', 'Taille de haie 20 m');
  await page.locator('#devis-form input[type="checkbox"][required]').check();
  await page.locator('#submit-btn').click();
}

export const mailQueue = (page) => page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('pino_mail_queue') || '[]'); } catch (e) { return []; }
});

export const mailOutboxLocal = (page) => page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('pino_mail_outbox') || '[]'); } catch (e) { return []; }
});

export async function openAuthModal(page) {
  await page.evaluate(() => window.openLoginModal());
  await expect(page.locator('#modal-window-auth')).toHaveJSProperty('open', true);
}

export async function loginWithPassword(page, email, password) {
  await openAuthModal(page);
  const emailInput = page.locator('#login-email');
  await emailInput.clear();
  await emailInput.fill(email);
  const passwordInput = page.locator('#login-password');
  await passwordInput.clear();
  await passwordInput.fill(password);
  await page.locator('#auth-view-login form button[type="submit"]').click();
}

export const firebaseUser = (page) => page.evaluate(() => {
  const u = window.pinoAuth && window.pinoAuth.currentUser;
  return u ? { uid: u.uid, email: u.email, emailVerified: u.emailVerified } : null;
});

export const cachedSession = (page) => page.evaluate(() => localStorage.getItem('pino_current_user'));
