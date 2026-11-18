    import * as THREE from 'three';
    import { CONFIG } from '../config.js';

    export function crearEscena(contenedor) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.colorNiebla);
    scene.fog = new THREE.Fog(CONFIG.colorNiebla, CONFIG.nieblaCerca, CONFIG.nieblaLejos);

    const ancho = contenedor.clientWidth || window.innerWidth;
    const alto = contenedor.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(55, ancho / alto, 0.1, 300);
    camera.position.set(0, 3.5, -7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(ancho, alto);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    contenedor.appendChild(renderer.domElement);

    const redimensionar = () => {
        const w = contenedor.clientWidth || window.innerWidth;
        const h = contenedor.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);
    };
    window.addEventListener('resize', redimensionar);

    const liberar = () => {
        window.removeEventListener('resize', redimensionar);
        renderer.dispose();
    };

    return { scene, camera, renderer, liberar };
    }