import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { ARButton } from 'https://unpkg.com/three@0.154.0/examples/jsm/webxr/ARButton.js';
import { OrbitControls } from 'https://unpkg.com/three@0.154.0/examples/jsm/controls/OrbitControls.js';

let camera, scene, renderer;
let icosahedronMesh, torusMesh, circleMesh; // Updated mesh names
let controls;

init();
animate();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Сцена
    scene = new THREE.Scene();

    // Камера
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 40);

    // Об'єкт рендерингу
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Світло
    const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
    directionalLight.position.set(3, 3, 3);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 10, 10);
    pointLight.position.set(-2, 2, 2);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // 1. IcosahedronGeometry (smaller)
    const icosahedronGeometry = new THREE.IcosahedronGeometry(0.35, 0);
    const icosahedronMaterial = new THREE.MeshStandardMaterial({
        color: 0x00bfff,
        metalness: 0.7,
        roughness: 0.2,
        flatShading: true,
        emissive: 0x222244,
        emissiveIntensity: 0.3
    });
    icosahedronMesh = new THREE.Mesh(icosahedronGeometry, icosahedronMaterial);
    icosahedronMesh.position.x = -0.75;
    scene.add(icosahedronMesh);

    // 2. TorusGeometry (smaller)
    const torusGeometry = new THREE.TorusGeometry(0.25, 0.09, 16, 100);
    const torusMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xff69b4,
        metalness: 0.9,
        roughness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        reflectivity: 0.8,
        transmission: 0.5,
        transparent: true,
        opacity: 0.8
    });
    torusMesh = new THREE.Mesh(torusGeometry, torusMaterial);
    scene.add(torusMesh);

    // 3. CircleGeometry (smaller)
    const circleGeometry = new THREE.CircleGeometry(0.3, 64);
    const circleMaterial = new THREE.MeshStandardMaterial({
        color: 0x32cd32,
        side: THREE.DoubleSide,
        metalness: 0.3,
        roughness: 0.7,
        emissive: 0x003300,
        emissiveIntensity: 0.5
    });
    circleMesh = new THREE.Mesh(circleGeometry, circleMaterial);
    circleMesh.position.x = 0.75;
    circleMesh.rotation.x = Math.PI / 2;
    scene.add(circleMesh);

    // Позиція для камери
    camera.position.z = 3;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    document.body.appendChild(ARButton.createButton(renderer));

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
    controls.update();
}

function render() {
    animateObjects();
    renderer.render(scene, camera);
}

// Updated animation function
function animateObjects() {
    // Icosahedron: rotate on Y and bounce on Y axis
    icosahedronMesh.rotation.y += 0.02;
    icosahedronMesh.position.y = Math.sin(Date.now() * 0.002) * 0.15;

    // Torus: rotate on X and Z, pulse scale
    torusMesh.rotation.x += 0.025;
    torusMesh.rotation.z += 0.015;
    const scale = 1 + 0.2 * Math.sin(Date.now() * 0.003);
    torusMesh.scale.set(scale, scale, scale);

    // Circle: rotate on Z, fade opacity, float and pulse scale
    circleMesh.rotation.z += 0.018;
    circleMesh.material.opacity = 0.7 + 0.3 * Math.abs(Math.sin(Date.now() * 0.0015));
    circleMesh.position.y = 0.15 * Math.sin(Date.now() * 0.0025);
    const circleScale = 1 + 0.15 * Math.sin(Date.now() * 0.004);
    circleMesh.scale.set(circleScale, circleScale, circleScale);
}