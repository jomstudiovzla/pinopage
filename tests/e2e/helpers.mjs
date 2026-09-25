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

export async function openSite(page) {
  await page.addInitScript(() => {
    try { localStorage.setItem('pino_cookie_consent', 'essential_only'); } catch (e) {}
  });
  await page.goto('/index.html?emulator=1');
  await page.waitForFunction(() => window.PINO_USE_EMULATOR === true && !!window.pinoAuth);
}

export async function openAuthModal(page) {
  await page.evaluate(() => window.openLoginModal());
  await expect(page.locator('#modal-window-auth')).toHaveJSProperty('open', true);
}

export async function loginWithPassword(page, email, password) {
  await openAuthModal(page);
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.locator('#auth-view-login form button[type="submit"]').click();
}

export const firebaseUser = (page) => page.evaluate(() => {
  const u = window.pinoAuth && window.pinoAuth.currentUser;
  return u ? { uid: u.uid, email: u.email, emailVerified: u.emailVerified } : null;
});

export const cachedSession = (page) => page.evaluate(() => localStorage.getItem('pino_current_user'));
