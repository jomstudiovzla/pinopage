import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const firebase = JSON.parse(readFileSync('firebase.json', 'utf8'));
const sources = (firebase.hosting.rewrites || []).map((r) => r.source);

describe('FASE 4 — URLs publiques OAuth Consent Screen', () => {
  it('rewrites privacy et CGV existent (sans catch-all SPA, ou avant **)', () => {
    const catchIdx = sources.indexOf('**');
    const privacyIdx = sources.indexOf('/politique-de-confidentialite');
    const termsIdx = sources.indexOf('/conditions-generales');
    assert.ok(privacyIdx >= 0, 'rewrite /politique-de-confidentialite manquant');
    assert.ok(termsIdx >= 0, 'rewrite /conditions-generales manquant');
    assert.ok(catchIdx === -1 || (catchIdx > privacyIdx && catchIdx > termsIdx),
      'privacy/CGV après le catch-all SPA');
  });

  it('aliases LCEN /confidentialite /cgv /mentions-legales présents (avant ** s’il existe)', () => {
    const catchIdx = sources.indexOf('**');
    for (const src of ['/confidentialite', '/cgv', '/mentions-legales']) {
      const i = sources.indexOf(src);
      assert.ok(i >= 0, `${src} manquant`);
      if (catchIdx !== -1) assert.ok(i < catchIdx, `${src} doit précéder **`);
    }
  });

  it('canonicales rgpd/cgv sur le domaine officiel', () => {
    const rgpd = readFileSync('public/legal/rgpd.html', 'utf8');
    const cgv = readFileSync('public/legal/cgv.html', 'utf8');
    assert.match(rgpd, /canonical[^>]+https:\/\/pinoespacesverts\.online\/politique-de-confidentialite/);
    assert.match(cgv, /canonical[^>]+https:\/\/pinoespacesverts\.online\/conditions-generales/);
    assert.match(rgpd, /Politique de Confidentialité/);
    assert.match(cgv, /Conditions Générales de Vente/);
  });

  it('pages légales publiques : pas de login, SIRET déjà présent', () => {
    const rgpd = readFileSync('public/legal/rgpd.html', 'utf8');
    const cgv = readFileSync('public/legal/cgv.html', 'utf8');
    assert.doesNotMatch(rgpd, /firebase\.auth|signInWith|pinoConsumeRedirectResult/);
    assert.doesNotMatch(cgv, /firebase\.auth|signInWith|pinoConsumeRedirectResult/);
    assert.match(cgv, /105 075 006 00012/);
  });

  it('sitemap, footer, logo 120px et guide console existent', () => {
    const sitemap = readFileSync('public/sitemap.xml', 'utf8');
    const home = readFileSync('index.html', 'utf8');
    assert.match(sitemap, /pinoespacesverts\.online\/politique-de-confidentialite/);
    assert.match(sitemap, /pinoespacesverts\.online\/conditions-generales/);
    assert.match(home, /href="\/politique-de-confidentialite"/);
    assert.match(home, /href="\/conditions-generales"/);
    assert.equal(existsSync('docs/auth/OAUTH_CONSENT_SCREEN.md'), true);
    assert.equal(existsSync('assets/logo/oauth-consent-120.png'), true);
  });

  it('build.mjs copie les alias HTML à la racine de dist/', () => {
    const build = readFileSync('scripts/build.mjs', 'utf8');
    assert.match(build, /politique-de-confidentialite\.html/);
    assert.match(build, /conditions-generales\.html/);
    assert.match(build, /LEGAL_ALIASES/);
  });
});
