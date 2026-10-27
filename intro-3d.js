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
      const destination = document.getElementById('heroSection');
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
  scene.fog = new THREE.Fog(0x9bd2d2, 13, 34);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  camera.position.set(0, 0.35, 12.6);

  scene.add(new THREE.HemisphereLight(0xf7ffff, 0x1765a8, 3.8));
  const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
  keyLight.position.set(-5, 7, 8);
  scene.add(keyLight);
  const greenLight = new THREE.PointLight(0x35e594, 30, 22, 2);
  greenLight.position.set(4.5, -1.5, 5);
  scene.add(greenLight);
  const blueLight = new THREE.PointLight(0x2d91ff, 24, 20, 2);
  blueLight.position.set(-5, 2.5, 4);
  scene.add(blueLight);

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

  /* The hero objects intentionally use saturated brand colours and a larger
     silhouette. The previous white wireframe disappeared into the pale sky. */
  const heroObjects = new THREE.Group();
  world.add(heroObjects);

  const shuttle = new THREE.Group();
  const cork = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 32, 20),
    new THREE.MeshPhysicalMaterial({
      color: 0x0871c8,
      roughness: 0.24,
      metalness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.16
    })
  );
  cork.scale.set(1, 0.82, 1);
  shuttle.add(cork);

  const skirtFill = new THREE.Mesh(
    new THREE.ConeGeometry(0.94, 1.78, 18, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xeafff7,
      roughness: 0.22,
      transmission: 0.18,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  skirtFill.position.y = 1;
  shuttle.add(skirtFill);

  const skirtMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    wireframe: true
  });
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.96, 1.82, 18, 3, true), skirtMaterial);
  skirt.position.y = 1.01;
  shuttle.add(skirt);
  const skirtRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.96, 0.035, 10, 64),
    new THREE.MeshBasicMaterial({ color: 0x6dffd0, transparent: true, opacity: 0.9 })
  );
  skirtRim.position.y = 1.91;
  skirtRim.rotation.x = Math.PI / 2;
  shuttle.add(skirtRim);
  shuttle.position.set(4.3, -0.85, 0.55);
  shuttle.rotation.set(0.42, -0.52, 0.74);
  shuttle.scale.setScalar(coarsePointer ? 1.48 : 1.85);
  heroObjects.add(shuttle);

  const racket = new THREE.Group();
  const racketFrameMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x075fb4,
    roughness: 0.2,
    metalness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.12
  });
  const racketHead = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.095, 14, 72), racketFrameMaterial);
  racketHead.scale.y = 1.18;
  racket.add(racketHead);

  const stringPoints = [];
  for (let i = -5; i <= 5; i += 1) {
    const x = i * 0.205;
    const halfY = Math.sqrt(Math.max(0, 1.25 * 1.25 - x * x)) * 1.18;
    stringPoints.push(x, -halfY, 0, x, halfY, 0);
    const y = i * 0.235;
    const halfX = Math.sqrt(Math.max(0, 1.22 * 1.22 - (y / 1.18) ** 2));
    stringPoints.push(-halfX, y, 0, halfX, y, 0);
  }
  const stringsGeometry = new THREE.BufferGeometry();
  stringsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stringPoints, 3));
  const strings = new THREE.LineSegments(
    stringsGeometry,
    new THREE.LineBasicMaterial({ color: 0xdffeff, transparent: true, opacity: 0.46 })
  );
  racket.add(strings);

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.85, 12), racketFrameMaterial);
  shaft.position.y = -2.3;
  racket.add(shaft);
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.17, 1.25, 14),
    new THREE.MeshPhysicalMaterial({ color: 0x13a86c, roughness: 0.48, clearcoat: 0.6 })
  );
  grip.position.y = -3.72;
  racket.add(grip);
  racket.position.set(-4.4, 0.35, -0.2);
  racket.rotation.set(-0.18, 0.32, -0.42);
  racket.scale.setScalar(coarsePointer ? 0.82 : 1.04);
  heroObjects.add(racket);

  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0xcaffee,
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(4.7, 0.028, 8, 128), haloMaterial);
  halo.scale.y = 0.42;
  halo.rotation.set(0.55, -0.18, -0.13);
  halo.position.z = -1.8;
  heroObjects.add(halo);
  const haloTwo = new THREE.Mesh(new THREE.TorusGeometry(3.55, 0.022, 8, 96), haloMaterial.clone());
  haloTwo.material.color.setHex(0x9cd4ff);
  haloTwo.material.opacity = 0.32;
  haloTwo.scale.y = 0.5;
  haloTwo.rotation.set(-0.5, 0.22, 0.3);
  haloTwo.position.z = -2.6;
  heroObjects.add(haloTwo);

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
      camera.position.x = pointer.x * 0.72;
      camera.position.y = 0.35 - pointer.y * 0.48;
      camera.position.z = 12.6 - exitProgress * 6.2;
      world.rotation.y = pointer.x * 0.075;
      world.rotation.x = pointer.y * 0.042;
      heroObjects.position.z = exitProgress * 2.8;
      heroObjects.rotation.z = pointer.x * -0.025;
      shuttle.position.y = -0.85 + Math.sin(elapsed * 1.15) * 0.28;
      shuttle.rotation.y = -0.52 + elapsed * 0.32 * exitSpeed + pointer.x * 0.18;
      shuttle.rotation.z = 0.74 + Math.sin(elapsed * 0.72) * 0.09;
      racket.position.y = 0.35 + Math.sin(elapsed * 0.78 + 1.2) * 0.22;
      racket.rotation.y = 0.32 + Math.sin(elapsed * 0.55) * 0.16 - pointer.x * 0.14;
      racket.rotation.x = -0.18 + pointer.y * 0.12;
      halo.rotation.z = -0.13 + elapsed * 0.055;
      haloTwo.rotation.z = 0.3 - elapsed * 0.07;
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

    camera.lookAt(pointer.x * -0.15, pointer.y * 0.08, -1.3);
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
