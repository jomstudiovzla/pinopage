import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  clampPct,
  navState,
  applyPct,
  readPct,
  initBaSlider,
} = require('../../assets/js/pino-ba-slider.js');

describe('PinoBaSlider — helpers', () => {
  it('clampPct borne 0–100 et fallback 50', () => {
    assert.equal(clampPct(-10), 0);
    assert.equal(clampPct(0), 0);
    assert.equal(clampPct(50), 50);
    assert.equal(clampPct(100), 100);
    assert.equal(clampPct(140), 100);
    assert.equal(clampPct('x'), 50);
    assert.equal(clampPct(undefined), 50);
  });

  it('navState désactive prev à 0 % et next à 100 %', () => {
    assert.deepEqual(navState(0), { prevDisabled: true, nextDisabled: false });
    assert.deepEqual(navState(50), { prevDisabled: false, nextDisabled: false });
    assert.deepEqual(navState(100), { prevDisabled: false, nextDisabled: true });
    assert.equal(navState(0.2).prevDisabled, true);
    assert.equal(navState(99.8).nextDisabled, true);
  });

  it('applyPct / readPct synchronisent handle et masque', () => {
    const resize = { style: { width: '50%' } };
    const handle = { style: { left: '50%' } };
    assert.equal(applyPct(resize, handle, 25), 25);
    assert.equal(resize.style.width, '25%');
    assert.equal(handle.style.left, '25%');
    assert.equal(readPct(resize), 25);
    applyPct(resize, handle, 200);
    assert.equal(readPct(resize), 100);
  });

  it('initBaSlider refuse un nœud incomplet', () => {
    assert.equal(initBaSlider(null), null);
    assert.equal(initBaSlider({ querySelector: () => null }), null);
  });
});
