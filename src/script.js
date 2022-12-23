import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Texture Loader
const loader = new THREE.TextureLoader();
const bakedTexture = loader.load('/textures/baked-texture.jpg');
bakedTexture.flipY = false;
bakedTexture.minFilter = THREE.NearestFilter;

// Materials
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });

// Models

let title = null;

const gltfLoader = new GLTFLoader();
gltfLoader.load('/models/presepio.glb', (gltf) => {
  title = gltf.scene.children.find((child) => child.name === 'title');
  title.material.side = THREE.DoubleSide;

  const baseMesh = gltf.scene.children.find(
    (child) => child.name === 'prato-raso',
  );
  const cradleMesh = gltf.scene.children.find(
    (child) => child.name === 'cradle',
  );
  const shedMesh = gltf.scene.children.find((child) => child.name === 'shed');
  baseMesh.traverse((child) => {
    child.material = bakedMaterial;
  });
  cradleMesh.traverse((child) => {
    child.material = bakedMaterial;
  });
  shedMesh.traverse((child) => {
    child.material = bakedMaterial;
  });
  scene.add(gltf.scene);

  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      // child.castShadow = true;
      // child.receiveShadow = true;

      if (child.material.map) {
        child.material.map.minFilter = THREE.NearestFilter;
        child.customDepthMaterial = new THREE.MeshDistanceMaterial({
          map: child.material.map,
          alphaTest: 0.75,
        });
      }
    }
  });
});

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
// directionalLight.castShadow = true;
// directionalLight.shadow.bias = -0.005;
// directionalLight.shadow.mapSize.set(1024, 1024);
// directionalLight.shadow.camera.far = 16;
// directionalLight.shadow.camera.left = -9;
// directionalLight.shadow.camera.top = 9;
// directionalLight.shadow.camera.right = 9;
// directionalLight.shadow.camera.bottom = -6;

// const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
// scene.add(helper);

// directionalLight.position.set(5, 5, 5);
// scene.add(directionalLight);

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Soundtrack
const soundtrack = new Audio(`/sounds/christmas.mp3`);
const toggleSoundtrack = () => {
  soundtrack.volume = 0.03;
  soundtrack.loop = true;

  if (soundtrack.paused) {
    soundtrack.play();
  } else {
    soundtrack.pause();
  }
};

const button = document.querySelector('.music');
button.addEventListener('click', () => {
  toggleSoundtrack();
  button.classList.toggle('playing');
});

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Base camera
let cameraDistance = 0;
const setCameraDistance = () => {
  const deviceCoeficient = Math.max(2, 2560 / sizes.width);
  const modifier = Math.min(12, deviceCoeficient * deviceCoeficient);
  cameraDistance = 9 + modifier;
};
setCameraDistance();

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100,
);
camera.position.set(0, 6, 0);
scene.add(camera);

// Controls
// const controls = new OrbitControls(camera, canvas);
// controls.target.set(0, 0.75, 0);
// controls.enableDamping = true;
// controls.autoRotate = true;

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setClearColor(0x0f0f0f, 1);
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Snow
const count = 800;
const positions = [];
const colors = [];
const velocities = [];

const sphereRadius = 10;
const centerHeight = 7;
const minHeight = 1;

const generateSpherePoint = () => {
  const x0 = 0;
  const y0 = centerHeight;
  const z0 = 0;

  var theta = 2 * Math.PI * Math.random();
  var phi = Math.acos(2 * Math.random() - 1);

  var x = x0 + sphereRadius * Math.sin(phi) * Math.cos(theta);
  var y = y0 + sphereRadius * Math.sin(phi) * Math.sin(theta);
  var z = z0 + sphereRadius * Math.cos(phi);

  if (y < minHeight) {
    return generateSpherePoint();
  }
  return [x, y, z];
};

for (let i = 0; i < count; i++) {
  const coords = generateSpherePoint();
  positions.push(coords[0]);
  positions.push(coords[1]);
  positions.push(coords[2]);
}
for (let i = 0; i < count; i++) {
  velocities.push(Math.floor(Math.random() * 6 - 3) * 0.001);
  velocities.push(Math.floor(Math.random() * 5 + 0.12) * 0.0018 + 0.001);
  velocities.push(Math.floor(Math.random() * 6 - 3) * 0.001);
}
for (let i = 0; i < count * 3; i++) {
  colors.push(1);
}
const particlesGeometry = new THREE.BufferGeometry();
const positionsArray = new Float32Array(positions);
const colorsArray = new Float32Array(colors);
particlesGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positionsArray, 3),
);
particlesGeometry.setAttribute(
  'color',
  new THREE.BufferAttribute(colorsArray, 3),
);

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.2,
  sizeAttenuation: true,
});
particlesMaterial.vertexColors = true;

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

const textureLoader = new THREE.TextureLoader();
const particlesTexture = textureLoader.load('/textures/snow.png');
particlesMaterial.transparent = true;
particlesMaterial.alphaMap = particlesTexture;

particlesMaterial.depthWrite = false;
particlesMaterial.blending = THREE.AdditiveBlending;

// Animate
const clock = new THREE.Clock();
let previousTime = 0;

const distanceToCenter = (i) =>
  Math.sqrt(
    Math.pow(particlesGeometry.attributes.position.array[i], 2) +
      Math.pow(
        particlesGeometry.attributes.position.array[i + 1] - centerHeight,
        2,
      ) +
      Math.pow(particlesGeometry.attributes.position.array[i + 2], 2),
  );

const updateParticles = () => {
  for (let i = 0; i < count; i++) {
    const i3 = 3 * i;
    particlesGeometry.attributes.position.array[i3] -= velocities[i3];
    particlesGeometry.attributes.position.array[i3 + 1] -= velocities[i3 + 1];
    particlesGeometry.attributes.position.array[i3 + 2] -= velocities[i3 + 2];
    if (
      particlesGeometry.attributes.position.array[i3 + 1] < minHeight ||
      distanceToCenter(i3) > sphereRadius + 0.1
    ) {
      const coords = generateSpherePoint();
      particlesGeometry.attributes.position.array[i3] = coords[0];
      particlesGeometry.attributes.position.array[i3 + 1] = coords[1];
      particlesGeometry.attributes.position.array[i3 + 2] = coords[2];
    }
  }
  particlesGeometry.attributes.position.needsUpdate = true;
};
const updateCamera = (elapsedTime) => {
  const x = Math.sin(elapsedTime * 0.5) * 0.1 + 0.5;
  camera.position.x = Math.sin(x) * cameraDistance;
  camera.position.z = Math.cos(x) * cameraDistance;
  camera.lookAt(0, 3, 0);
};

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  updateParticles();
  updateCamera(elapsedTime);

  // Update controls
  // controls.update();

  if (title) {
    title.lookAt(camera.position);
    title.rotation.y -= Math.PI / 3;
  }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
