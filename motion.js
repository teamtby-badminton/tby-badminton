/* Progressive enhancement: content stays visible if motion is unavailable. */
(() => {
  const main = document.querySelector('main');
  if (!main || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const selector = '.tby-social-banner, .hero-content > *, .section-head, .event-card, .lookup-card, .video-card, .rule-grid > article';
  const tracked = new Set();
  const played = new WeakSet();
  const running = new Map();

  function finish(element) {
    const animation = running.get(element);
    if (animation) animation.cancel();
    running.delete(element);
  }

  const observer = new IntersectionObserver(entries => {
    let order = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting || played.has(entry.target) || preference.matches) continue;
      const element = entry.target;
      played.add(element);
      observer.unobserve(element);
      // Keyboard interaction always takes priority over decorative motion.
      if (element.contains(document.activeElement)) continue;
      const animation = element.animate([
        { opacity: 0.12, transform: 'translateY(34px) scale(0.975)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], {
        duration: 820,
        delay: Math.min(order++ * 65, 195),
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
