const mount = document.getElementById('hero3d');
const hero = document.getElementById('heroSection');

if (mount && hero) {
  let started = false;
  const startHero3D = () => {
    if (started) return;
    started = true;
    import('https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.min.js')
      .catch(() => import('https://unpkg.com/three@0.164.1/build/three.module.js'))
      .catch(() => import('./assets/vendor/three.module.min.js'))
      .then((THREE) => {
        hero.classList.add('hero-three-loaded');
        initHero3D(THREE);
      })
      .catch(() => hero.classList.add('hero-3d-fallback'));
  };

  const intro = document.getElementById('tbyIntro');
  if (intro && !intro.hidden) {
    intro.addEventListener('tby:intro-exit', () => window.setTimeout(startHero3D, 520), { once: true });
  } else {
    startHero3D();
  }
}

function initHero3D(THREE) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !coarsePointer,
      powerPreference: 'high-performance'
    });
  } catch (_) {
    hero.classList.add('hero-3d-fallback');
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.15 : 1.6));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xeaf5f5, 0.035);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  camera.position.set(5.2, 4.7, 11.8);

  const world = new THREE.Group();
  world.position.set(2.9, 0.25, 0);
  world.rotation.y = -0.14;
  scene.add(world);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3d7693, 2.3));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
  keyLight.position.set(-4, 9, 7);
  scene.add(keyLight);
  const greenLight = new THREE.PointLight(0x39d276, 10, 18, 2);
  greenLight.position.set(5, 2, -3);
  scene.add(greenLight);

  const court = new THREE.Mesh(
    new THREE.PlaneGeometry(6.1, 13.4),
    new THREE.MeshStandardMaterial({
      color: 0x0a64b0,
      roughness: 0.56,
      metalness: 0.06,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    })
  );
  court.rotation.x = -Math.PI / 2;
  court.position.y = -2.35;
  world.add(court);

  const courtGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(6.45, 13.75),
    new THREE.MeshBasicMaterial({ color: 0x60d88a, transparent: true, opacity: 0.055 })
  );
  courtGlow.rotation.x = -Math.PI / 2;
  courtGlow.position.y = -2.38;
  world.add(courtGlow);

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.68
  });

  const addCourtLine = (points) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map(([x, z]) => new THREE.Vector3(x, -2.31, z))
    );
    world.add(new THREE.Line(geometry, lineMaterial));
  };

  addCourtLine([[-3.05, -6.7], [3.05, -6.7], [3.05, 6.7], [-3.05, 6.7], [-3.05, -6.7]]);
  addCourtLine([[-2.59, -6.7], [-2.59, 6.7]]);
  addCourtLine([[2.59, -6.7], [2.59, 6.7]]);
  addCourtLine([[-3.05, -1.98], [3.05, -1.98]]);
  addCourtLine([[-3.05, 1.98], [3.05, 1.98]]);
  addCourtLine([[-3.05, -5.94], [3.05, -5.94]]);
  addCourtLine([[-3.05, 5.94], [3.05, 5.94]]);
  addCourtLine([[0, -6.7], [0, -1.98]]);
  addCourtLine([[0, 1.98], [0, 6.7]]);

  const netMaterial = new THREE.MeshBasicMaterial({
    color: 0x0759ad,
    transparent: true,
    opacity: 0.24,
    wireframe: true,
    side: THREE.DoubleSide
  });
  const net = new THREE.Mesh(new THREE.PlaneGeometry(6.25, 1.45, 28, 6), netMaterial);
  net.position.set(0, -1.6, 0);
  world.add(net);

  const postMaterial = new THREE.MeshStandardMaterial({
    color: 0x06417b,
    roughness: 0.32,
    metalness: 0.45,
    transparent: true,
    opacity: 0.72
  });
  for (const x of [-3.22, 3.22]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.8, 12), postMaterial);
    post.position.set(x, -1.46, 0);
    world.add(post);
  }

  const shuttle = new THREE.Group();
  const cork = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 18, 12),
    new THREE.MeshStandardMaterial({ color: 0xf3f7ee, roughness: 0.55 })
  );
  cork.scale.set(1, 0.82, 1);
  shuttle.add(cork);

  const skirt = new THREE.Mesh(
    new THREE.ConeGeometry(0.38, 0.82, 10, 2, true),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.45,
      transparent: true,
      opacity: 0.76,
      side: THREE.DoubleSide,
      wireframe: true
    })
  );
  skirt.position.y = 0.46;
  shuttle.add(skirt);
  shuttle.position.set(-1.0, 1.15, 0.35);
  shuttle.rotation.set(0.25, -0.3, 0.88);
  shuttle.scale.setScalar(1.7);
  world.add(shuttle);

  const flightCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.8, -0.8, 2.1),
    new THREE.Vector3(-2.2, 1.35, 1.1),
    new THREE.Vector3(-0.35, 2.1, 0.25),
    new THREE.Vector3(1.7, 1.05, -0.65),
    new THREE.Vector3(3.7, -0.35, -1.35)
  ]);
  const arcPoints = flightCurve.getPoints(72);
  const arc = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(arcPoints),
    new THREE.LineBasicMaterial({ color: 0x10a94f, transparent: true, opacity: 0.22 })
  );
  world.add(arc);

  const particles = new THREE.Group();
  const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x0b72ce, transparent: true, opacity: 0.18 });
  const particleGeometry = new THREE.SphereGeometry(0.045, 8, 8);
  const particleCount = coarsePointer ? 7 : 14;
  for (let i = 0; i < particleCount; i += 1) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.set(
      -1.5 + ((i * 1.83) % 5.6),
      -0.7 + ((i * 1.17) % 3.7),
      -3.2 + ((i * 2.29) % 6.2)
    );
    particle.userData.phase = i * 0.77;
    particle.userData.baseY = particle.position.y;
    particle.userData.baseZ = particle.position.z;
    particles.add(particle);
  }
  world.add(particles);

  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let width = 0;
  let height = 0;
  let frame = 0;
  let lastFrameTime = 0;
  let visible = true;
  const clock = new THREE.Clock();

  const resize = () => {
    const rect = mount.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < 700 ? 43 : 34;
    camera.updateProjectionMatrix();
    camera.lookAt(2.1, -1.0, 0);
  };

  const onPointerMove = (event) => {
    const rect = mount.getBoundingClientRect();
    target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  const render = (frameTime = 0) => {
    frame = 0;
    if (coarsePointer && frameTime - lastFrameTime < 40 && !reducedMotion.matches) {
      frame = requestAnimationFrame(render);
      return;
    }
    lastFrameTime = frameTime;
    const elapsed = clock.getElapsedTime();
    const progress = Math.min(1, Math.max(0, Number(hero.__journeyProgress) || 0));
    const easedProgress = progress * progress * (3 - 2 * progress);
    if (!reducedMotion.matches) {
      pointer.x += (target.x - pointer.x) * 0.035;
      pointer.y += (target.y - pointer.y) * 0.035;
      camera.position.x = 5.2 - easedProgress * 3.1 + pointer.x * 0.42;
      camera.position.y = 4.7 - easedProgress * 1.3 - pointer.y * 0.22;
      camera.position.z = 11.8 - easedProgress * 2.7;
      world.position.x = 2.9 - easedProgress * 2.35;
      world.position.y = 0.25 + Math.sin(progress * Math.PI) * 0.35;
      world.rotation.y = -0.14 + easedProgress * 0.34 + pointer.x * 0.025;
      world.rotation.z = -easedProgress * 0.055;

      const flightPoint = flightCurve.getPointAt(Math.min(.999, progress));
      shuttle.position.copy(flightPoint);
      shuttle.position.y += Math.sin(elapsed * 1.25) * 0.12;
      shuttle.rotation.x = 0.25 + Math.sin(progress * Math.PI) * 0.22;
      shuttle.rotation.y = -0.3 + elapsed * (0.22 + progress * 0.65);
      shuttle.rotation.z = 0.88 - progress * 0.42;
      shuttle.scale.setScalar(1.7 + Math.sin(progress * Math.PI) * .42);
      arc.material.opacity = 0.16 + Math.sin(progress * Math.PI) * 0.22;
      court.material.opacity = 0.2 + progress * 0.1;
      net.material.opacity = 0.18 + progress * 0.13;
      particles.children.forEach((particle) => {
        particle.position.y = particle.userData.baseY + Math.sin(elapsed * 0.7 + particle.userData.phase) * (0.09 + progress * 0.08);
        particle.position.z = particle.userData.baseZ + progress * 0.48;
      });
    }
    camera.lookAt(2.1 - easedProgress * 1.1, -1.0 + easedProgress * .25, 0);
    renderer.render(scene, camera);
    if (visible && !reducedMotion.matches) frame = requestAnimationFrame(render);
  };

  const requestRender = () => {
    if (!frame && visible) frame = requestAnimationFrame(render);
  };

  const resizeObserver = new ResizeObserver(() => {
    resize();
    requestRender();
  });
  resizeObserver.observe(hero);

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestRender();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }, { threshold: 0.02 });
  visibilityObserver.observe(hero);

  if (!reducedMotion.matches) hero.addEventListener('pointermove', onPointerMove, { passive: true });
  hero.addEventListener('pointerleave', () => {
    target.x = 0;
    target.y = 0;
  }, { passive: true });

  renderer.domElement.addEventListener('webglcontextlost', () => {
    hero.classList.add('hero-3d-fallback');
  }, { passive: true });

  resize();
  renderer.render(scene, camera);
  requestRender();
  hero.classList.add('hero-3d-ready');

  window.addEventListener('pagehide', () => {
    if (frame) cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    renderer.dispose();
  }, { once: true });
}
