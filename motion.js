/* Progressive enhancement: content stays visible if motion is unavailable. */
(() => {
  const main = document.querySelector('main');
  if (!main || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const selector = '.hero-content > *, .section-head > *, .event-main h3, .video-card h3, .rule-grid > article > *';
  const tracked = new Set();
  const played = new WeakSet();
  const running = new Map();

  function finish(element) {
    const animation = running.get(element);
    if (animation) animation.cancel();
    running.delete(element);
  }

  const observer = new IntersectionObserver(entries => {

    for (const entry of entries) {
      if (!entry.isIntersecting || played.has(entry.target) || preference.matches) continue;
      const element = entry.target;
      played.add(element);
      observer.unobserve(element);
      // Keyboard interaction always takes priority over decorative motion.
      if (element.contains(document.activeElement) || running.size >= 3) continue;
      const animation = element.animate([
        { opacity: 0.5, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], {
        duration: 420,
        delay: 0,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'backwards'
      });
      running.set(element, animation);
      animation.onfinish = () => running.delete(element);
    }
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

  function collect() {
    for (const element of tracked) {
      if (!element.isConnected) {
        observer.unobserve(element);
        finish(element);
        tracked.delete(element);
      }
    }
    main.querySelectorAll(selector).forEach(element => {
      if (tracked.has(element)) return;
      tracked.add(element);
      if (!preference.matches) observer.observe(element);
    });
  }

  let frame = 0;
  new MutationObserver(() => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; collect(); });
  }).observe(main, { childList: true, subtree: true });

  main.addEventListener('focusin', event => {
    for (const element of running.keys()) {
      if (element.contains(event.target)) finish(element);
    }
  });

  preference.addEventListener('change', () => {
    observer.disconnect();
    for (const element of running.keys()) finish(element);
    if (!preference.matches) {
      for (const element of tracked) {
        if (!played.has(element)) observer.observe(element);
      }
    }
  });
  collect();
})();

// A single, scroll-driven depth engine for the full page. It deliberately uses
// DOM transforms rather than extra WebGL canvases so mobile only renders one
// Three.js scene at a time while cards still feel spatial and responsive.
(() => {
  const main = document.querySelector('main');
  if (!main || !('IntersectionObserver' in window)) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = matchMedia('(pointer: coarse)');
  const itemSelector = [
    '.section-head',
    '#events > .event-card',
    '.lookup-card',
    '.lookup-results > .lookup-result-card',
    '#videoFeed > .video-card',
    '#rulesList > article',
    'footer .footer-inner'
  ].join(',');

  const tracked = new Map();
  const active = new Set();
  const trackedSections = new Set();
  let frame = 0;
  let collectFrame = 0;
  let lastFrameTime = 0;

  const clamp = (value, min = -1, max = 1) => Math.min(max, Math.max(min, value));
  const strengthFor = (element) => {
    if (element.matches('.section-head')) return 0.42;
    if (element.matches('.footer-inner, .follow-inner')) return 0.58;
    return 1;
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) active.add(entry.target);
      else active.delete(entry.target);
    });
    requestTick();
  }, { rootMargin: '18% 0px 18% 0px', threshold: 0 });

  const setPointer = (element, event) => {
    const meta = tracked.get(element);
    if (!meta || coarsePointer.matches || reducedMotion.matches) return;
    const rect = element.getBoundingClientRect();
    meta.pointerX = clamp((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5, -0.5, 0.5);
    meta.pointerY = clamp((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5, -0.5, 0.5);
    requestTick();
  };

  const resetPointer = (element) => {
    const meta = tracked.get(element);
    if (!meta) return;
    meta.pointerX = 0;
    meta.pointerY = 0;
    requestTick();
  };

  const register = (element) => {
    if (tracked.has(element)) return;
    const meta = { strength: strengthFor(element), pointerX: 0, pointerY: 0 };
    tracked.set(element, meta);
    element.classList.add('motion-depth');
    if (!element.matches('.section-head')) element.classList.add('motion-depth-card');
    if (!coarsePointer.matches) {
      element.addEventListener('pointermove', (event) => setPointer(element, event), { passive: true });
      element.addEventListener('pointerleave', () => resetPointer(element), { passive: true });
    }
    observer.observe(element);
  };

  const registerSection = (section, index) => {
    if (trackedSections.has(section)) return;
    trackedSections.add(section);
    section.classList.add('page-depth-section');
    let orb = section.querySelector(':scope > .section-depth-orb');
    if (!orb) {
      orb = document.createElement('span');
      orb.className = `section-depth-orb${index % 2 ? ' section-depth-orb-alt' : ''}`;
      orb.setAttribute('aria-hidden', 'true');
      section.prepend(orb);
    }
    observer.observe(section);
  };

  const collect = () => {
    collectFrame = 0;
    document.querySelectorAll(itemSelector).forEach(register);
    main.querySelectorAll(':scope > .section').forEach(registerSection);
    requestTick();
  };

  const update = (time = 0) => {
    frame = 0;
    if (document.hidden || reducedMotion.matches) return;
    if (coarsePointer.matches && time - lastFrameTime < 30) return;
    lastFrameTime = time;
    const viewport = Math.max(1, window.innerHeight);
    const mobile = coarsePointer.matches || window.innerWidth < 769;

    active.forEach((element) => {
      if (!element.isConnected) {
        active.delete(element);
        observer.unobserve(element);
        tracked.delete(element);
        trackedSections.delete(element);
        return;
      }

      const rect = element.getBoundingClientRect();
      const position = clamp((rect.top + rect.height * 0.5 - viewport * 0.5) / (viewport * 0.82));

      if (element.classList.contains('page-depth-section')) {
        element.style.setProperty('--section-depth-y', `${(position * (mobile ? -13 : -24)).toFixed(1)}px`);
        element.style.setProperty('--section-depth-x', `${(position * (mobile ? 5 : 12)).toFixed(1)}px`);
        return;
      }

      const meta = tracked.get(element);
      if (!meta) return;
      const strength = meta.strength;
      const scrollY = position * (mobile ? -9 : -17) * strength;
      const depthZ = (1 - Math.min(1, Math.abs(position))) * (mobile ? 7 : 14) * strength;
      const scrollRotate = position * (mobile ? -1.05 : -1.7) * strength;
      const pointerRotateX = mobile ? 0 : -meta.pointerY * 6 * strength;
      const pointerRotateY = mobile ? 0 : meta.pointerX * 7 * strength;

      element.style.setProperty('--motion-y', `${scrollY.toFixed(2)}px`);
      element.style.setProperty('--motion-z', `${depthZ.toFixed(2)}px`);
      element.style.setProperty('--motion-rx', `${(scrollRotate + pointerRotateX).toFixed(2)}deg`);
      element.style.setProperty('--motion-ry', `${pointerRotateY.toFixed(2)}deg`);
    });
  };

  function requestTick() {
    if (!frame && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(update);
  }

  const resetAll = () => {
    tracked.forEach((_, element) => {
      element.style.removeProperty('--motion-y');
      element.style.removeProperty('--motion-z');
      element.style.removeProperty('--motion-rx');
      element.style.removeProperty('--motion-ry');
    });
    trackedSections.forEach((section) => {
      section.style.removeProperty('--section-depth-y');
      section.style.removeProperty('--section-depth-x');
    });
  };

  new MutationObserver(() => {
    if (!collectFrame) collectFrame = requestAnimationFrame(collect);
  }).observe(main, { childList: true, subtree: true });

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick, { passive: true });
  document.addEventListener('visibilitychange', requestTick, { passive: true });
  reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches) resetAll();
    else requestTick();
  });
  coarsePointer.addEventListener?.('change', requestTick);

  document.documentElement.classList.add('page-depth-ready');
  collect();
})();

// Highlight the visible section without a continuous rendering loop.
(() => {
  if (!('IntersectionObserver' in window)) return;
  const links = [...document.querySelectorAll('#mainNav a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const visible = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
    const active = sections.find(section => visible.has(section));
    links.forEach(link => {
      const selected = !!active && link.hash === '#' + active.id;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-15% 0px -45% 0px', threshold: 0 });
  sections.forEach(section => observer.observe(section));
})();
