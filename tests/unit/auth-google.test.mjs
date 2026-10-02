import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  shouldUseRedirectAuth,
  isInAppBrowser,
  isMobileUa,
} = require('../../assets/js/pino-auth-google.js');

function env(over) {
  const base = {
    navigator: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0',
      maxTouchPoints: 0,
      platform: 'MacIntel',
    },
    matchMedia: () => ({ matches: false }),
    screen: { width: 1440, height: 900 },
    innerWidth: 1440,
    innerHeight: 900,
  };
  const o = over || {};
  return {
    ...base,
    ...o,
    navigator: { ...base.navigator, ...(o.navigator || {}) },
    screen: { ...base.screen, ...(o.screen || {}) },
  };
}

describe('pino-auth-google stratégie', () => {
  it('bureau souris → popup (pas de redirect)', () => {
    assert.equal(shouldUseRedirectAuth(env()), false);
  });

  it('iPhone (UA + tactile compact) → redirect', () => {
    const e = env({
      navigator: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        maxTouchPoints: 5,
        platform: 'iPhone',
      },
      matchMedia: (q) => ({ matches: /pointer:\s*coarse/.test(q) }),
      screen: { width: 390, height: 844 },
      innerWidth: 390,
      innerHeight: 844,
    });
    assert.equal(isMobileUa(e), true);
    assert.equal(shouldUseRedirectAuth(e), true);
  });

  it('iPadOS (MacIntel + maxTouchPoints > 1) → redirect', () => {
    const e = env({
      navigator: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        maxTouchPoints: 5,
        platform: 'MacIntel',
      },
      screen: { width: 1024, height: 1366 },
    });
    assert.equal(shouldUseRedirectAuth(e), true);
  });

  it('navigateur in-app Instagram → redirect', () => {
    const e = env({
      navigator: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Instagram 312.0.0',
        maxTouchPoints: 5,
        platform: 'iPhone',
      },
      screen: { width: 390, height: 844 },
    });
    assert.equal(isInAppBrowser(e), true);
    assert.equal(shouldUseRedirectAuth(e), true);
  });

  it('PWA standalone tactile → redirect', () => {
    const e = env({
      navigator: { userAgent: 'Mozilla/5.0', maxTouchPoints: 5, platform: 'Linux armv8l' },
      matchMedia: (q) => ({ matches: /display-mode:\s*standalone/.test(q) || /pointer:\s*coarse/.test(q) }),
      screen: { width: 412, height: 915 },
    });
    assert.equal(shouldUseRedirectAuth(e), true);
  });

  it('Chrome Android (UA Mobile) → redirect', () => {
    const e = env({
      navigator: {
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
        maxTouchPoints: 5,
        platform: 'Linux armv8l',
      },
      screen: { width: 412, height: 915 },
    });
    assert.equal(shouldUseRedirectAuth(e), true);
  });
});
