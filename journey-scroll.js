(() => {
  const hero = document.getElementById('heroSection');
  const heroInner = document.getElementById('heroInner');
  const sceneTwo = document.querySelector('[data-journey-scene="2"]');
  const sceneThree = document.querySelector('[data-journey-scene="3"]');
  const progressFill = document.querySelector('.journey-progress-track i');
  const progressNumber = document.querySelector('.journey-progress-number');
  const scrollCue = document.querySelector('.journey-scroll-cue');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!hero || !heroInner || !sceneTwo || !sceneThree) return;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = (start, end, value) => {
    const x = clamp((value - start) / (end - start));
    return x * x * (3 - 2 * x);
  };

  let ticking = false;

  const setScene = (element, opacity, shift, active) => {
    element.style.setProperty('--scene-opacity', opacity.toFixed(3));
    element.style.setProperty('--scene-shift', `${shift.toFixed(1)}px`);
    element.classList.toggle('is-active', active);
    element.setAttribute('aria-hidden', active ? 'false' : 'true');
  };

  const update = () => {
    ticking = false;

    if (reducedMotion.matches) {
      hero.__journeyProgress = 0;
      heroInner.style.removeProperty('--hero-intro-opacity');
      return;
    }

    const rect = hero.getBoundingClientRect();
    const viewport = Math.max(1, window.innerHeight);
    const range = Math.max(1, hero.offsetHeight - viewport);
    const progress = clamp(-rect.top / range);
    hero.__journeyProgress = progress;
    hero.style.setProperty('--journey-progress', progress.toFixed(4));
    hero.style.setProperty('--journey-bg-opacity', (0.28 + progress * 0.12).toFixed(3));
    hero.style.setProperty('--journey-bg-x', `${(78 - progress * 24).toFixed(2)}%`);
    hero.style.setProperty('--journey-bg-scale', (1.015 + progress * 0.035).toFixed(4));

    const introOpacity = 1 - smooth(0.12, 0.29, progress);
    heroInner.style.setProperty('--hero-intro-opacity', introOpacity.toFixed(3));
    heroInner.style.setProperty('--hero-intro-shift', `${((1 - introOpacity) * -54).toFixed(1)}px`);
    heroInner.style.setProperty('--hero-intro-scale', (0.96 + introOpacity * 0.04).toFixed(4));
    heroInner.style.setProperty('--hero-intro-blur', `${((1 - introOpacity) * 9).toFixed(1)}px`);
    heroInner.classList.toggle('is-inactive', introOpacity < 0.18);

    const sceneTwoIn = smooth(0.22, 0.36, progress);
    const sceneTwoOut = 1 - smooth(0.51, 0.64, progress);
    const sceneTwoOpacity = sceneTwoIn * sceneTwoOut;
    setScene(sceneTwo, sceneTwoOpacity, 62 - smooth(0.22, 0.64, progress) * 108, sceneTwoOpacity > 0.55);

    const sceneThreeOpacity = smooth(0.58, 0.74, progress);
    setScene(sceneThree, sceneThreeOpacity, 72 - smooth(0.58, 0.82, progress) * 72, sceneThreeOpacity > 0.55);

    if (progressNumber) {
      progressNumber.textContent = progress < 0.3 ? '01' : progress < 0.65 ? '02' : '03';
    }
    if (progressFill) progressFill.style.transform = `scaleY(${Math.max(0.025, progress).toFixed(3)})`;
    if (scrollCue) scrollCue.style.opacity = String(1 - smooth(0.72, 0.9, progress));
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  reducedMotion.addEventListener?.('change', requestUpdate);
  update();
})();
