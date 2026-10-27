const intro = document.getElementById('tbyIntro');
const mount = document.getElementById('intro3d');
const enterButton = document.getElementById('introEnterBtn');

if (intro && enterButton) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let exiting = false;

  document.documentElement.classList.add('intro-active');
  document.body.classList.add('intro-active');
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

  const enterSite = (event) => {
    event.preventDefault();
    if (exiting) return;
    exiting = true;
    intro.classList.add('intro-leaving');
    intro.dispatchEvent(new CustomEvent('tby:intro-exit'));

    window.setTimeout(() => {
      intro.hidden = true;
      intro.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('intro-active');
      document.body.classList.remove('intro-active');
      const destination = document.getElementById('keo');
      if (destination) {
        destination.scrollIntoView({
          behavior: reducedMotion.matches ? 'auto' : 'smooth',
          block: 'start'
        });
      }
    }, reducedMotion.matches ? 260 : 900);
  };

  enterButton.addEventListener('click', enterSite);
  window.setTimeout(() => enterButton.focus({ preventScroll: true }), 500);

  if (mount) {
    import('./assets/vendor/three.module.min.js')
      .then((THREE) => initIntroScene(THREE, { intro, mount, reducedMotion, isExiting: () => exiting }))
      .catch(() => intro.classList.add('intro-3d-fallback'));
  }
}

function initIntroScene(THREE, context) {
  const { intro, mount, reducedMotion, isExiting } = context;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !coarsePointer,
      powerPreference: 'high-performance'
    });
  } catch (_) {
    intro.classList.add('intro-3d-fallback');
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarsePointer ? 1 : 1.5));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xa9d7d4, 8, 30);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  camera.position.set(0, 0.4, 11.5);

  scene.add(new THREE.HemisphereLight(0xf7ffff, 0x2a6fa2, 3.1));
  const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
  keyLight.position.set(-5, 7, 8);
  scene.add(keyLight);
  const greenLight = new THREE.PointLight(0x49dc8a, 18, 18, 2);
  greenLight.position.set(5, -1, 3);
  scene.add(greenLight);

  const world = new THREE.Group();
  scene.add(world);

  const cloudGeometry = new THREE.IcosahedronGeometry(1, 2);
  const cloudMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf7ffff,
    roughness: 1,
    transparent: true,
    opacity: 0.23,
    depthWrite: false
  });
  const cloudField = new THREE.Group();
  const cloudCount = coarsePointer ? 14 : 24;
  for (let i = 0; i < cloudCount; i += 1) {
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    const side = i % 2 === 0 ? -1 : 1;
    cloud.position.set(
      side * (4.4 + (i * 1.37) % 7.2),
      -3.8 + (i * 1.83) % 8.6,
      -14 + (i * 2.71) % 22
    );
    cloud.scale.set(
      1.6 + (i % 4) * 0.48,
      0.7 + (i % 3) * 0.22,
      1.2 + (i % 5) * 0.26
    );
    cloud.rotation.set(i * 0.21, i * 0.37, i * 0.11);
    cloud.userData.speed = 0.45 + (i % 5) * 0.08;
    cloudField.add(cloud);
  }
  world.add(cloudField);

  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-8, -3.2, -7),
    new THREE.Vector3(-4, 2.8, -3),
    new THREE.Vector3(0, -1.2, 0),
    new THREE.Vector3(4.5, 2.2, -2),
    new THREE.Vector3(8, -2.6, -8)
  ]);
  const pathMesh = new THREE.Mesh(
    new THREE.TubeGeometry(path, 90, 0.018, 6, false),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
  );
  pathMesh.rotation.z = -0.08;
  world.add(pathMesh);

  const shuttle = new THREE.Group();
  const cork = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0xf1f0df, roughness: 0.7 })
  );
  cork.scale.set(1, 0.82, 1);
  shuttle.add(cork);

  const skirtMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.5,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    wireframe: true
  });
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.82, 1.65, 14, 3, true), skirtMaterial);
  skirt.position.y = 0.93;
  shuttle.add(skirt);
  shuttle.position.set(3.9, -1.1, -0.8);
  shuttle.rotation.set(0.3, -0.35, 0.82);
  shuttle.scale.setScalar(1.12);
  world.add(shuttle);

  const windGeometry = new THREE.BoxGeometry(0.018, 0.018, 1.6);
  const windMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.36 });
  const windCount = coarsePointer ? 12 : 26;
  const wind = new THREE.InstancedMesh(windGeometry, windMaterial, windCount);
  const dummy = new THREE.Object3D();
  const windData = [];
  for (let i = 0; i < windCount; i += 1) {
    const item = {
      x: -8 + (i * 3.17) % 16,
      y: -5 + (i * 2.23) % 10,
      z: -12 + (i * 2.87) % 18,
      speed: 0.06 + (i % 4) * 0.016
    };
    windData.push(item);
    dummy.position.set(item.x, item.y, item.z);
    dummy.updateMatrix();
    wind.setMatrixAt(i, dummy.matrix);
  }
  world.add(wind);

  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const clock = new THREE.Clock();
  let frame = 0;
  let disposed = false;
  let exitProgress = 0;

  const resize = () => {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < 700 ? 52 : 42;
    camera.updateProjectionMatrix();
  };

  const onPointerMove = (event) => {
    target.x = (event.clientX / window.innerWidth - 0.5) * 2;
    target.y = (event.clientY / window.innerHeight - 0.5) * 2;
  };

  const render = () => {
    if (disposed) return;
    const elapsed = clock.getElapsedTime();
    const exitSpeed = isExiting() ? 5.2 : 1;
    if (isExiting()) exitProgress = Math.min(1, exitProgress + 0.025);

    if (!reducedMotion.matches) {
      pointer.x += (target.x - pointer.x) * 0.035;
      pointer.y += (target.y - pointer.y) * 0.035;
      camera.position.x = pointer.x * 0.42;
      camera.position.y = 0.4 - pointer.y * 0.26;
      camera.position.z = 11.5 - exitProgress * 4.6;
      world.rotation.y = pointer.x * 0.025;
      world.rotation.x = pointer.y * 0.012;
      shuttle.position.y = -1.1 + Math.sin(elapsed * 1.2) * 0.18;
      shuttle.rotation.y = -0.35 + elapsed * 0.18 * exitSpeed;
      shuttle.rotation.z = 0.82 + Math.sin(elapsed * 0.7) * 0.06;
      cloudField.children.forEach((cloud) => {
        cloud.position.z += 0.004 * cloud.userData.speed * exitSpeed;
        if (cloud.position.z > 9) cloud.position.z = -15;
      });
      windData.forEach((item, index) => {
        item.z += item.speed * exitSpeed;
        if (item.z > 9) item.z = -14;
        dummy.position.set(item.x, item.y, item.z);
        dummy.scale.set(1, 1, isExiting() ? 2.5 : 1);
        dummy.updateMatrix();
        wind.setMatrixAt(index, dummy.matrix);
      });
      wind.instanceMatrix.needsUpdate = true;
    }

    camera.lookAt(0, 0, -1.5);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('resize', resize);
    intro.removeEventListener('pointermove', onPointerMove);
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    renderer.dispose();
  };

  window.addEventListener('resize', resize, { passive: true });
  if (!coarsePointer && !reducedMotion.matches) {
    intro.addEventListener('pointermove', onPointerMove, { passive: true });
  }
  intro.addEventListener('tby:intro-exit', () => window.setTimeout(dispose, 1000), { once: true });
  window.addEventListener('pagehide', dispose, { once: true });

  resize();
  renderer.render(scene, camera);
  intro.classList.add('intro-3d-ready');
  if (!reducedMotion.matches) frame = requestAnimationFrame(render);
}
