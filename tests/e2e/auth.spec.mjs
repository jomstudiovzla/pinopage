// Flux d'authentification réels : inscription, vérification, connexion, portes dérobées, session.
import { test, expect } from '@playwright/test';
import {
  resetEmulators, createUser, oobCodes, clickVerificationLink, dbGet,
  openSite, openAuthModal, loginWithPassword, firebaseUser, cachedSession,
} from './helpers.mjs';

const PASS = 'Jardin-2026!';

// Panne du service d'authentification : le SDK répond comme sans réseau (identique Chromium / WebKit).
const simulateAuthOutage = (page) => page.evaluate(() => {
  const fail = () => Promise.reject(Object.assign(new Error('network'), { code: 'auth/network-request-failed' }));
  const auth = firebase.auth();
  auth.signInWithEmailAndPassword = fail;
  auth.createUserWithEmailAndPassword = fail;
});

test.beforeEach(async () => { await resetEmulators(); });

test('inscription → e-mail de vérification → connexion bloquée → lien cliqué → espace client', async ({ page }) => {
  const email = `claire.${Date.now()}@example.com`;
  await openSite(page);
  await openAuthModal(page);
  await page.locator('#auth-tab-btn-register').click();
  await page.fill('#reg-fullname', 'Claire Test');
  await page.fill('#reg-email', email);
  await page.fill('#reg-password', PASS);
  await page.fill('#reg-password-confirm', PASS);
  await page.locator('#auth-view-register form button[type="submit"]').click();

  // Aucune session avant vérification, e-mail réellement émis par Firebase Auth.
  await expect(page.locator('#login-error-text')).toContainText('lien de confirmation');
  await expect.poll(() => oobCodes(email, 'VERIFY_EMAIL').then((c) => c.length)).toBeGreaterThan(0);
  expect(await firebaseUser(page)).toBeNull();
  expect(await cachedSession(page)).toBeNull();

  // Tentative de connexion sans vérification : refusée.
  await page.fill('#login-password', PASS);
  await page.locator('#auth-view-login form button[type="submit"]').click();
  await expect(page.locator('#login-error-text')).toContainText('pas encore vérifiée');
  expect(await firebaseUser(page)).toBeNull();

  // Clic sur le lien reçu, puis connexion : Espace Client ouvert.
  await clickVerificationLink(email);
  await page.locator('#auth-view-login form button[type="submit"]').click();
  await expect(page.locator('#modal-window-client')).toHaveJSProperty('open', true);
  const u = await firebaseUser(page);
  expect(u && u.emailVerified).toBe(true);

  // Profil et coupon -20 % créés côté base sous l'identité Firebase réelle.
  await expect.poll(() => dbGet(`users/${u.uid}/email`)).toBe(email);
  await expect.poll(() => dbGet(`coupons/${u.uid}/descuento_pct`)).toBe(20);
});

test('mauvais mot de passe : erreur visible, aucune session', async ({ page }) => {
  await createUser('bob@example.com', PASS);
  await openSite(page);
  await loginWithPassword(page, 'bob@example.com', 'mauvais-mdp');
  await expect(page.locator('#login-error-text')).toContainText('incorrect');
  expect(await firebaseUser(page)).toBeNull();
  expect(await cachedSession(page)).toBeNull();
  await expect(page.locator('#modal-window-client')).toHaveJSProperty('open', false);
});

test('porte dérobée supprimée : e-mail admin + mot de passe quelconque → refus', async ({ page }) => {
  await createUser('pino.espacesverts@gmail.com', 'Vrai-MotDePasse-Admin-2026');
  await openSite(page);
  for (const guess of ['Pino2026!', 'abcd', '1234']) {
    await loginWithPassword(page, 'pino.espacesverts@gmail.com', guess);
    await expect(page.locator('#login-error-msg')).toBeVisible();
    expect(await cachedSession(page)).toBeNull();
    await expect(page.locator('#modal-window-admin')).toHaveJSProperty('open', false);
  }
  const msgs = [];
  page.on('console', (m) => msgs.push(m.text()));
  expect(msgs.join('\n')).not.toMatch(/admin fallback|admin_direct/i);
});

test('porte dérobée supprimée : e-mail admin inexistant + service indisponible → refus', async ({ page }) => {
  await openSite(page);
  await simulateAuthOutage(page);
  await loginWithPassword(page, 'jomstudiovzla@gmail.com', 'nimportequoi');
  await expect(page.locator('#login-error-msg')).toBeVisible();
  expect(await cachedSession(page)).toBeNull();
  await expect(page.locator('#modal-window-admin')).toHaveJSProperty('open', false);
});

test('inscription quand Firebase est injoignable : aucun compte local créé', async ({ page }) => {
  await openSite(page);
  await simulateAuthOutage(page);
  await openAuthModal(page);
  await page.locator('#auth-tab-btn-register').click();
  await page.fill('#reg-fullname', 'Hors Ligne');
  await page.fill('#reg-email', 'horsligne@example.com');
  await page.fill('#reg-password', PASS);
  await page.fill('#reg-password-confirm', PASS);
  await page.locator('#auth-view-register form button[type="submit"]').click();
  await expect(page.locator('#reg-error-msg')).toBeVisible();
  const local = await page.evaluate(() => JSON.parse(localStorage.getItem('pino_users') || '[]'));
  expect(local.find((u) => u.email === 'horsligne@example.com')).toBeUndefined();
  expect(await cachedSession(page)).toBeNull();
});

test('admin avec e-mail NON vérifié : pas d\'accès au panneau admin', async ({ page }) => {
  await createUser('pino.espacesverts@gmail.com', PASS, { verified: false });
  await openSite(page);
  await loginWithPassword(page, 'pino.espacesverts@gmail.com', PASS);
  await expect(page.locator('#login-error-text')).toContainText('pas encore vérifiée');
  await expect(page.locator('#modal-window-admin')).toHaveJSProperty('open', false);
  expect(await firebaseUser(page)).toBeNull();
});

test('admin vérifié : panneau admin ouvert et données lisibles', async ({ page }) => {
  await createUser('pino.espacesverts@gmail.com', PASS);
  await openSite(page);
  await loginWithPassword(page, 'pino.espacesverts@gmail.com', PASS);
  await expect(page.locator('#modal-window-admin')).toHaveJSProperty('open', true);
  const canRead = await page.evaluate(() => window.pinoRtdb.ref('users').once('value').then(() => true, () => false));
  expect(canRead).toBe(true);
});

test('session falsifiée dans localStorage (admin) : effacée au chargement, aucune donnée lisible', async ({ page }) => {
  await openSite(page);
  await page.evaluate(() => localStorage.setItem('pino_current_user', JSON.stringify({
    uid: 'admin_andrespino', email: 'pino.espacesverts@gmail.com', role: 'admin', isAdmin: true, provider: 'admin_direct',
  })));
  await page.reload();
  await page.waitForFunction(() => !!window.pinoAuth);
  await expect.poll(() => cachedSession(page)).toBeNull();
  const canRead = await page.evaluate(() => window.pinoRtdb.ref('users').once('value').then(() => true, () => false));
  expect(canRead).toBe(false);
  await expect(page.locator('#modal-window-admin')).toHaveJSProperty('open', false);
});

test('session réelle : survit au vidage de localStorage et au rechargement', async ({ page }) => {
  await createUser('alice@example.com', PASS);
  await openSite(page);
  await loginWithPassword(page, 'alice@example.com', PASS);
  await expect(page.locator('#modal-window-client')).toHaveJSProperty('open', true);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => !!window.pinoAuth);
  await expect.poll(() => firebaseUser(page).then((u) => u && u.email)).toBe('alice@example.com');
  await expect.poll(() => cachedSession(page).then((s) => s && JSON.parse(s).email)).toBe('alice@example.com');
});

test('déconnexion : signOut Firebase et stockage de session vidé', async ({ page }) => {
  await createUser('alice@example.com', PASS);
  await openSite(page);
  await loginWithPassword(page, 'alice@example.com', PASS);
  await expect(page.locator('#modal-window-client')).toHaveJSProperty('open', true);
  await page.evaluate(() => window.handleLogout());
  await expect.poll(() => firebaseUser(page)).toBeNull();
  expect(await cachedSession(page)).toBeNull();
});

test('mot de passe oublié : e-mail de réinitialisation émis', async ({ page }) => {
  await createUser('alice@example.com', PASS);
  await openSite(page);
  const before = (await oobCodes('alice@example.com', 'PASSWORD_RESET')).length;
  await openAuthModal(page);
  await page.fill('#login-email', 'alice@example.com');
  await page.getByRole('button', { name: 'Mot de passe oublié ?' }).click();
  await expect(page.locator('#login-error-text')).toContainText('réinitialisation');
  await expect.poll(() => oobCodes('alice@example.com', 'PASSWORD_RESET').then((c) => c.length)).toBe(before + 1);
});

test('mot de passe oublié : adresse inconnue signalée', async ({ page }) => {
  await openSite(page);
  await openAuthModal(page);
  await page.fill('#login-email', 'inconnu@example.com');
  await page.getByRole('button', { name: 'Mot de passe oublié ?' }).click();
  await expect(page.locator('#login-error-text')).toContainText(/Aucun compte|Si un compte existe/);
});

test('Apple : aucun bouton ni panneau simulé tant que le fournisseur n\'est pas activé', async ({ page }) => {
  await openSite(page);
  await openAuthModal(page);
  await expect(page.locator('#apple-auth-btn')).toBeHidden();
  await expect(page.locator('#apple-auth-quick-panel')).toHaveCount(0);
  expect(await page.evaluate(() => typeof window.confirmAppleQuickSignIn)).toBe('undefined');
  expect(await page.evaluate(() => typeof window.confirmGoogleQuickSignIn)).toBe('undefined');
});

test('Google (popup) : connexion via le fournisseur, profil créé', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Le widget IdP de l\'émulateur ne s\'ouvre pas en popup sous WebKit headless.');
  await openSite(page);
  await openAuthModal(page);
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: /Continuer avec Google/ }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  await popup.getByText('Add new account').click();
  await popup.fill('#email-input', 'gardener@gmail.com');
  await popup.fill('#display-name-input', 'Gardener Google');
  await popup.getByRole('button', { name: /Sign in with Google/ }).click();
  await expect(page.locator('#modal-window-client')).toHaveJSProperty('open', true);
  const u = await firebaseUser(page);
  expect(u.email).toBe('gardener@gmail.com');
  await expect.poll(() => dbGet(`users/${u.uid}/auth_provider`)).toBe('google');
});
