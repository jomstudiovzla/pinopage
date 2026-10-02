/**
 * Curseur Avant / Après (FASE 5).
 * Une instance par .ba-slider : le premier nœud du DOM (lightbox) ne vole plus
 * les événements du curseur de la galerie.
 */
(function (global) {
  'use strict';

  var STEP = 10;
  var END_EPS = 0.5;

  function clampPct(pct) {
    var n = Number(pct);
    if (!isFinite(n)) return 50;
    if (n < 0) return 0;
    if (n > 100) return 100;
    return n;
  }

  function navState(pct) {
    var p = clampPct(pct);
    return {
      prevDisabled: p <= END_EPS,
      nextDisabled: p >= 100 - END_EPS
    };
  }

  function readPct(resize) {
    if (!resize) return 50;
    var raw = resize.style && resize.style.width;
    if (raw) {
      var parsed = parseFloat(raw);
      if (isFinite(parsed)) return clampPct(parsed);
    }
    return 50;
  }

  function applyPct(resize, handle, pct) {
    var p = clampPct(pct);
    var css = p + '%';
    if (resize) resize.style.width = css;
    if (handle) handle.style.left = css;
    return p;
  }

  function clientXOf(e) {
    if (e && typeof e.clientX === 'number' && e.clientX !== 0) return e.clientX;
    if (e && e.touches && e.touches[0]) return e.touches[0].clientX;
    if (e && e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientX;
    return 0;
  }

  function pctFromClientX(slider, clientX) {
    var rect = slider.getBoundingClientRect();
    if (!rect.width) return 50;
    return clampPct(((clientX - rect.left) / rect.width) * 100);
  }

  /**
   * @param {HTMLElement} slider
   * @param {{ onChange?: function(number): void }} [options]
   * @returns {{ setPct: function(number): number, getPct: function(): number, destroy: function(): void } | null}
   */
  function initBaSlider(slider, options) {
    if (!slider || !slider.querySelector) return null;
    var resize = slider.querySelector('.ba-resize');
    var handle = slider.querySelector('.ba-handle');
    if (!resize || !handle) return null;
    if (slider.getAttribute('data-ba-ready') === '1') return null;

    var onChange = options && typeof options.onChange === 'function' ? options.onChange : null;
    var dragging = false;
    var pointerId = null;

    function emit(pct) {
      slider.setAttribute('aria-valuenow', String(Math.round(pct)));
      if (onChange) onChange(pct);
    }

    function setPct(pct) {
      var p = applyPct(resize, handle, pct);
      emit(p);
      return p;
    }

    function getPct() {
      return readPct(resize);
    }

    function startDrag(e) {
      if (e && e.button != null && e.button !== 0) return;
      dragging = true;
      if (e && e.pointerId != null && slider.setPointerCapture) {
        pointerId = e.pointerId;
        try { slider.setPointerCapture(e.pointerId); } catch (err) {}
      }
      setPct(pctFromClientX(slider, clientXOf(e)));
      if (e && e.preventDefault) e.preventDefault();
    }

    function moveDrag(e) {
      if (!dragging) return;
      setPct(pctFromClientX(slider, clientXOf(e)));
      if (e && e.preventDefault && e.pointerType !== 'touch') e.preventDefault();
    }

    function endDrag(e) {
      dragging = false;
      if (pointerId != null && slider.releasePointerCapture) {
        try { slider.releasePointerCapture(pointerId); } catch (err) {}
      }
      pointerId = null;
      if (e && e.preventDefault && e.pointerType !== 'touch') e.preventDefault();
    }

    function onKey(e) {
      if (!e) return;
      var pct = getPct();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        setPct(pct - STEP);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setPct(pct + STEP);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setPct(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setPct(100);
      }
    }

    slider.setAttribute('tabindex', slider.getAttribute('tabindex') || '0');
    slider.setAttribute('role', 'slider');
    slider.setAttribute('aria-orientation', 'horizontal');
    slider.setAttribute('aria-valuemin', '0');
    slider.setAttribute('aria-valuemax', '100');
    if (!slider.getAttribute('aria-label')) {
      slider.setAttribute('aria-label', "Comparaison avant et après les travaux");
    }
    slider.setAttribute('data-ba-ready', '1');

    slider.addEventListener('pointerdown', startDrag);
    slider.addEventListener('pointermove', moveDrag);
    slider.addEventListener('pointerup', endDrag);
    slider.addEventListener('pointercancel', endDrag);
    slider.addEventListener('keydown', onKey);

    setPct(getPct());

    return {
      setPct: setPct,
      getPct: getPct,
      destroy: function () {
        slider.removeEventListener('pointerdown', startDrag);
        slider.removeEventListener('pointermove', moveDrag);
        slider.removeEventListener('pointerup', endDrag);
        slider.removeEventListener('pointercancel', endDrag);
        slider.removeEventListener('keydown', onKey);
        slider.removeAttribute('data-ba-ready');
      }
    };
  }

  function syncNav(pct, prevBtn, nextBtn, indicator) {
    var state = navState(pct);
    if (prevBtn) {
      prevBtn.disabled = state.prevDisabled;
      prevBtn.setAttribute('aria-disabled', state.prevDisabled ? 'true' : 'false');
    }
    if (nextBtn) {
      nextBtn.disabled = state.nextDisabled;
      nextBtn.setAttribute('aria-disabled', state.nextDisabled ? 'true' : 'false');
    }
    if (indicator) {
      indicator.textContent = Math.round(clampPct(pct)) + ' %';
    }
    return state;
  }

  function initBaSliderWithNav(slider, prevBtn, nextBtn, indicator) {
    var api = initBaSlider(slider, {
      onChange: function (pct) { syncNav(pct, prevBtn, nextBtn, indicator); }
    });
    if (!api) return null;
    if (prevBtn) {
      prevBtn.type = prevBtn.type || 'button';
      prevBtn.addEventListener('click', function () { api.setPct(0); });
    }
    if (nextBtn) {
      nextBtn.type = nextBtn.type || 'button';
      nextBtn.addEventListener('click', function () { api.setPct(100); });
    }
    syncNav(api.getPct(), prevBtn, nextBtn, indicator);
    return api;
  }

  var api = {
    STEP: STEP,
    clampPct: clampPct,
    navState: navState,
    readPct: readPct,
    applyPct: applyPct,
    syncNav: syncNav,
    initBaSlider: initBaSlider,
    initBaSliderWithNav: initBaSliderWithNav
  };

  global.PinoBaSlider = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
