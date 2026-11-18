    import * as THREE from 'three';
    import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
    import { RUTAS } from '../config.js';

    export async function cargarAmbiente(scene) {
    try {
        const textura = await new RGBELoader().loadAsync(RUTAS.hdr);
        textura.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = textura;
        scene.environment = textura;
        scene.environmentIntensity = 0.6;
        scene.backgroundIntensity = 0.9;
        return true;
    } catch (error) {
        console.warn(`No se pudo cargar el HDR (${RUTAS.hdr}). Se usa el fondo gris de respaldo.`, error);
        return false;
    }
    }