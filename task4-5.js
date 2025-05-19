import './src/style.css'

import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { ARButton } from 'https://unpkg.com/three@0.154.0/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.154.0/examples/jsm/loaders/GLTFLoader.js';

let container;
let camera, scene, renderer;
let reticle;
let controller;
let model = null;

init();
animate();

function init() {
    container = document.createElement("div");
    document.body.appendChild(container);

    // Сцена
    scene = new THREE.Scene();
    // Камера
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    // Рендеринг
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Світло
    var hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2);
    hemiLight.position.set(0.5, 1, 0.25);
    scene.add(hemiLight);

    var dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    var ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    // Контролер додавання об'єкта на сцену
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    // Додаємо нашу мітку поверхні на сцену
    addReticleToScene();

    // Тепер для AR-режиму необхідно застосувати режим hit-test
    const button = ARButton.createButton(renderer, {
        requiredFeatures: ["hit-test"]
    });
    document.body.appendChild(button);
    renderer.domElement.style.display = "none";

    window.addEventListener("resize", onWindowResize, false);

    const envMap = new THREE.CubeTextureLoader()
        .setPath('https://threejs.org/examples/textures/cube/Bridge2/')
        .load([
            'posx.jpg', 'negx.jpg',
            'posy.jpg', 'negy.jpg',
            'posz.jpg', 'negz.jpg'
        ]);
    scene.environment = envMap;
    scene.background = null;
}

function addReticleToScene() {
    const geometry = new THREE.RingGeometry(0.15, 0.2, 32);
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    const material = new THREE.MeshBasicMaterial();

    reticle = new THREE.Mesh(geometry, material);

    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
}

function onSelect() {
    if (reticle.visible) {
        const modelUrl = 'https://my-ar-models-bucket.s3.eu-north-1.amazonaws.com/MusicInstrument/scene.gltf';

        const loader = new GLTFLoader();

        if (model) {
            scene.remove(model);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });
            model = null;
        }

        loader.load(
            modelUrl,
            function (gltf) {
                model = gltf.scene;

                model.position.set(reticle.position.x, reticle.position.y, reticle.position.z);
                model.rotation.copy(reticle.rotation);
                model.scale.set(0.01, 0.01, 0.01);

                scene.add(model);

                // Світліший хромований матеріал
                const chromeMaterial = new THREE.MeshPhysicalMaterial({
                    color: 0xffffff,
                    metalness: 1.0,
                    roughness: 0.02,
                    reflectivity: 1.0,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.01,
                    envMap: envMap
                });

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.material = chromeMaterial;
                        child.material.needsUpdate = true;
                    }
                });

                console.log("Model added to scene at", model.position);
            },

            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },

            function (error) {
                console.error('Error loading model:', error);
            }
        );
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

let hitTestSource = null;
let localSpace = null;
let hitTestSourceInitialized = false;

async function initializeHitTestSource() {
    const session = renderer.xr.getSession();
    const viewerSpace = await session.requestReferenceSpace("viewer");
    hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
    localSpace = await session.requestReferenceSpace("local");
    hitTestSourceInitialized = true;
    session.addEventListener("end", () => {
        hitTestSourceInitialized = false;
        hitTestSource = null;
    });
}

function render(timestamp, frame) {
    if (frame) {
        if (!hitTestSourceInitialized) {
            initializeHitTestSource();
        }
        if (hitTestSourceInitialized) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(localSpace);
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
            } else {
                reticle.visible = false;
            }
        }
        renderer.render(scene, camera);
    }
}