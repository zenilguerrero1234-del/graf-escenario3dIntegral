    import * as THREE from 'three';
    import { RUTAS } from '../config.js';

    const TAMANO = 260;
    const REPETICIONES = 65;

    async function cargarTextura(cargador, ruta, esColor, renderer) {
    try {
        const textura = await cargador.loadAsync(ruta);
        textura.wrapS = THREE.RepeatWrapping;
        textura.wrapT = THREE.RepeatWrapping;
        textura.repeat.set(REPETICIONES, REPETICIONES);
        textura.anisotropy = renderer.capabilities.getMaxAnisotropy();
        if (esColor) textura.colorSpace = THREE.SRGBColorSpace;
        return textura;
    } catch (error) {
        console.warn(`No se pudo cargar la textura ${ruta}`, error);
        return null;
    }
    }

    export async function crearPiso(scene, renderer) {
    const cargador = new THREE.TextureLoader();
    const [mapa, normal, rugosidad] = await Promise.all([
        cargarTextura(cargador, RUTAS.piso.color, true, renderer),
        cargarTextura(cargador, RUTAS.piso.normal, false, renderer),
        cargarTextura(cargador, RUTAS.piso.roughness, false, renderer)
    ]);

    const material = new THREE.MeshStandardMaterial({
        color: mapa ? 0xffffff : 0x5c7a4a,
        map: mapa,
        normalMap: normal,
        roughnessMap: rugosidad,
        roughness: 1
    });

    const piso = new THREE.Mesh(new THREE.PlaneGeometry(TAMANO, TAMANO), material);
    piso.rotation.x = -Math.PI / 2;
    piso.receiveShadow = true;
    scene.add(piso);
    return piso;
    }