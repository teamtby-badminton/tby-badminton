/* TBY website mascot: no network, no changes to registration or admin logic. */
(() => {
  'use strict';
  if (document.getElementById('tby-web-mascot')) return;
  const source = document.currentScript?.src || window.location.href;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const small = window.matchMedia('(max-width: 760px)');

  const mascot = document.createElement('div');
  mascot.id = 'tby-web-mascot';
  mascot.setAttribute('aria-hidden', 'true');
  mascot.hidden = true;
  const picture = document.createElement('img');
  picture.className = 'tby-mascot-image';
  picture.alt = '';
  picture.draggable = false;
  picture.decoding = 'async';
  mascot.append(picture);
  document.body.append(mascot);

  let x = 16, y = 16, targetX = 16, targetY = 16;
  let frame = 0, timer = 0, last = 0, positioned = false;
  let ready = false, suspended = false, started = false;
  const bounds = () => {
    const size = small.matches ? 82 : 110;
    const viewport = window.visualViewport;
    const width = viewport?.width || document.documentElement.clientWidth || window.innerWidth;
    const height = viewport?.height || document.documentElement.clientHeight || window.innerHeight;
    const left = viewport?.offsetLeft || 0;
    const top = viewport?.offsetTop || 0;
    return {
      minX: left + 12, maxX: left + Math.max(12, width - size - 12),
      minY: top + 20, maxY: top + Math.max(20, height - size - 16)
    };
  };
  const place = () => {
    const b = bounds();
    x = Math.max(b.minX, Math.min(x, b.maxX));
    y = Math.max(b.minY, Math.min(y, b.maxY));
    mascot.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
  };
  const canMove = () => ready && !suspended && !document.hidden && !reduced.matches;
  const stop = () => {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    frame = timer = 0;
    last = 0;
    mascot.classList.remove('is-moving');
  };
  const plan = (delay = 900 + Math.random() * 1600) => {
    if (!canMove()) return;
    clearTimeout(timer);
    timer = window.setTimeout(walk, delay);
  };
  function step(now) {
    frame = 0;
    if (!canMove()) { stop(); return; }
    const dt = last ? Math.min((now - last) / 1000, .06) : 0;
    last = now;
    const dx = targetX - x, dy = targetY - y;
    const remaining = Math.hypot(dx, dy);
    const distance = (small.matches ? 30 : 45) * dt;
    if (remaining <= Math.max(distance, .5)) {
      x = targetX;
      y = targetY;
      place();
      stop();
      plan();
      return;
    }
    x += dx / remaining * distance;
    y += dy / remaining * distance;
    place();
    frame = requestAnimationFrame(step);
  }
  function walk() {
    timer = 0;
    if (!canMove()) return;
    const b = bounds();
    targetX = b.minX + Math.random() * (b.maxX - b.minX);
    targetY = b.minY + Math.random() * (b.maxY - b.minY);
    if (Math.hypot(targetX - x, targetY - y) < 80) {
      targetX = x < (b.minX + b.maxX) / 2 ? b.maxX : b.minX;
      targetY = y < (b.minY + b.maxY) / 2 ? b.maxY : b.minY;
    }
    if (Math.hypot(targetX - x, targetY - y) < 1) return;
    last = 0;
    mascot.classList.add('is-moving');
    frame = requestAnimationFrame(step);
  }
  function sync() {
    suspended = !!document.querySelector('dialog[open]') ||
      !!document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
    mascot.hidden = !ready || suspended;
    if (!positioned || reduced.matches) {
      const b = bounds();
      x = b.minX;
      y = b.maxY;
      positioned = true;
    }
    place();
    stop();
    if (canMove()) plan(started ? 1400 : 2500);
    started = true;
  }
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('focusin', sync);
  document.addEventListener('focusout', () => queueMicrotask(sync));
  window.addEventListener('resize', sync, { passive: true });
  window.addEventListener('pageshow', sync);
  window.addEventListener('pagehide', stop);
  window.visualViewport?.addEventListener('resize', sync, { passive: true });
  window.visualViewport?.addEventListener('scroll', sync, { passive: true });
  reduced.addEventListener('change', sync);
  // Includes dialogs inserted later by the application.
  const observer = new MutationObserver(sync);
  observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  picture.addEventListener('load', () => { ready = true; sync(); }, { once: true });
  picture.addEventListener('error', () => {
    ready = false;
    stop();
    mascot.hidden = true;
  });
  picture.src = new URL('assets/tby-mascot.png', source).href;
})();
