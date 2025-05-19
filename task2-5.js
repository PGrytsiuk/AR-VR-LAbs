import './src/style.css'

import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { ARButton } from 'https://unpkg.com/three@0.154.0/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.154.0/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let loader;
let model;

init();
animate();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 40);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.outputEncoding = THREE.sRGBEncoding;

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2); 
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2); 
    scene.add(ambientLight);
    
    // Додаємо GLTF модель на сцену
    const modelUrl = 'https://my-ar-models-bucket.s3.eu-north-1.amazonaws.com/scene.gltf';

    // Плейсхолдери для текстур
    const diffuseUrl   = 'https://my-ar-models-bucket.s3.eu-north-1.amazonaws.com/textures/devil_dog_low_poly_1_default_baseColor.png';
    const normalUrl    = 'https://my-ar-models-bucket.s3.eu-north-1.amazonaws.com/textures/devil_dog_low_poly_1_default_normal.png';
    const roughnessUrl = 'https://my-ar-models-bucket.s3.eu-north-1.amazonaws.com/textures/devil_dog_low_poly_1_default_metallicRoughness.png';
    const emissiveUrl  = 'https://my-ar-models-bucket.s3.eu-north-1.amazonaws.com/textures/devil_dog_low_poly_1_default_emissive.png';

    // Завантажуємо текстури
    const textureLoader = new THREE.TextureLoader();
    const diffuseMap   = textureLoader.load(diffuseUrl);
    const normalMap    = textureLoader.load(normalUrl);
    const roughnessMap = textureLoader.load(roughnessUrl);
    const emissiveMap  = textureLoader.load(emissiveUrl);

    // Створюємо матеріал з текстурами
    const texturedMaterial = new THREE.MeshStandardMaterial({
        map: diffuseMap,
        normalMap: normalMap,
        roughnessMap: roughnessMap,
        metalness: 1.0,
        roughness: 1.0,
        emissiveMap: emissiveMap,
        emissive: 0xffffff
    });

    // Створюємо завантажувач
    loader = new GLTFLoader();
    loader.load(
        modelUrl,
        function (gltf) {
            model = gltf.scene;
            model.position.z = -10;
            model.scale.set(1/6, 1/6, 1/6); // Зменшення у 6 разів
            scene.add(model);

            // Застосовуємо матеріал з текстурами до всіх мешів моделі
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = texturedMaterial;
                    child.material.needsUpdate = true;
                }
            });

            console.log("Model added to scene");
        },

        function (xhr) {
            // console.log((xhr.loaded / xhr.total * 100) + '% loaded' );
        },

        function (error) {
            console.error(error);
        }
    );

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
}

function render() {
    if (model !== undefined) {
        model.rotation.x = THREE.MathUtils.degToRad(-20); // нахил вниз на 20°
    }
    rotateModel();
    renderer.render(scene, camera);
}
    
let degrees = 0; // кут для оберту нашої моделі
    
function rotateModel() {
    if (model !== undefined) {
        degrees = degrees + 0.2; 
        model.rotation.y = THREE.MathUtils.degToRad(degrees);
    } 
}