    import * as THREE from 'three';
    import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
    import { RUTAS, CONFIG } from '../config.js';
    import { AdministradorAnimaciones, prepararClip, verificarEsqueleto } from './characterAnimations.js';

    export async function cargarPersonaje(scene, alProgreso = () => {}) {
    const cargador = new FBXLoader();
    const modelo = await cargador.loadAsync(RUTAS.personaje);

    // Escala automática: los FBX de Mixamo vienen en centímetros
    modelo.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(modelo);
    const altura = caja.max.y - caja.min.y;
    let factor = 1;
    if (altura > 0) {
        factor = CONFIG.alturaPersonaje / altura;
        modelo.scale.multiplyScalar(factor);
    }
    const ajusteY = -caja.min.y * factor;

    modelo.traverse((nodo) => {
        if (nodo.isMesh) {
        nodo.castShadow = true;
        nodo.receiveShadow = true;
        nodo.frustumCulled = false;
        }
    });

    const mixer = new THREE.AnimationMixer(modelo);
    const clips = {};
    const nombres = Object.keys(RUTAS.animaciones);
    let listos = 0;

    await Promise.all(
        nombres.map(async (nombre) => {
        const fbx = await cargador.loadAsync(RUTAS.animaciones[nombre]);
        const clip = fbx.animations[0];
        if (!clip) {
            throw new Error(`El archivo de la animación "${nombre}" no contiene ninguna secuencia.`);
        }
        clip.name = nombre;
        prepararClip(clip);
        verificarEsqueleto(modelo, clip, nombre);
        clips[nombre] = clip;
        listos++;
        alProgreso(listos / nombres.length);
        })
    );

    const animaciones = new AdministradorAnimaciones(mixer, clips);
    animaciones.reproducir('idle', 0);
    scene.add(modelo);

    return { modelo, animaciones, ajusteY };
    }