    import * as THREE from 'three';
    import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
    import { RUTAS, CONFIG } from '../config.js';
    import { AdministradorAnimaciones, prepararClip, verificarEsqueleto } from './characterAnimations.js';

    // Los materiales del FBX de Mixamo suelen verse oscuros. Se reemplazan por materiales
    // estándar más luminosos, conservando las texturas del personaje.
    function aclararMateriales(modelo) {
    const convertir = (viejo) => {
        if (viejo.map) viejo.map.colorSpace = THREE.SRGBColorSpace;

        const color = viejo.map ? new THREE.Color(0xffffff) : (viejo.color ? viejo.color.clone() : new THREE.Color(0xffffff));
        // Si el FBX no trajo textura y el color es casi negro, se usa un tono neutro
        if (!viejo.map && color.r + color.g + color.b < 0.25) color.set(0xb5a79a);

        const nuevo = new THREE.MeshStandardMaterial({
        map: viejo.map || null,
        normalMap: viejo.normalMap || null,
        alphaMap: viejo.alphaMap || null,
        color,
        roughness: 0.78,
        metalness: 0,
        transparent: viejo.transparent,
        opacity: viejo.opacity,
        side: viejo.side
        });

        // Un poco de autoiluminación: es lo que más aclara al personaje
        if (viejo.map) {
        nuevo.emissive = new THREE.Color(0xffffff);
        nuevo.emissiveMap = viejo.map;
        nuevo.emissiveIntensity = 0.18;
        } else {
        nuevo.emissive = color.clone();
        nuevo.emissiveIntensity = 0.15;
        }

        if (viejo.transparent) {
        nuevo.alphaTest = 0.35;
        nuevo.depthWrite = true;
        }
        nuevo.name = viejo.name;
        viejo.dispose();
        return nuevo;
    };

    modelo.traverse((nodo) => {
        if (!nodo.isMesh) return;
        nodo.material = Array.isArray(nodo.material) ? nodo.material.map(convertir) : convertir(nodo.material);
    });
    }

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

    aclararMateriales(modelo);

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

    // Luz propia que sigue al personaje (la posición se actualiza en characterControls.js)
    const luz = new THREE.PointLight(0xfff1de, 10, 10, 2);
    scene.add(luz);

    return { modelo, animaciones, ajusteY, luz };
    }