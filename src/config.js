    const BASE = import.meta.env.BASE_URL;

    export const RUTAS = {
    personaje: `${BASE}assets/models/character.fbx`,
    animaciones: {
        idle: `${BASE}assets/animations/idle.fbx`,
        walk: `${BASE}assets/animations/walk.fbx`,
        run: `${BASE}assets/animations/run.fbx`,
        dance: `${BASE}assets/animations/dance.fbx`,
        jump: `${BASE}assets/animations/jump.fbx`
    },
    hdr: `${BASE}assets/hdr/forest.hdr`,
    piso: {
        color: `${BASE}assets/textures/floor_color.png`,
        normal: `${BASE}assets/textures/floor_normal.png`,
        roughness: `${BASE}assets/textures/floor_roughness.png`
    }
    };

    export const CONFIG = {
    limite: 24,
    colorNiebla: 0xc9d1cf,
    nieblaCerca: 14,
    nieblaLejos: 70,
    alturaPersonaje: 1.8,
    radioCapsula: 0.45,
    velocidadCaminar: 1.8,
    velocidadCorrer: 4.2,
    fuerzaSalto: 5.5,
    velocidadGiro: 8,
    transicion: 0.25,
    inicio: { x: 0, z: 0 }
    };