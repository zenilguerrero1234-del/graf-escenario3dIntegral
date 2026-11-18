    import * as THREE from 'three';
    import { CONFIG } from '../config.js';

    // Quita el desplazamiento horizontal de la cadera para que la animación
    // no mueva al modelo por su cuenta. El movimiento lo controla la física.
    export function prepararClip(clip) {
    for (const pista of clip.tracks) {
        if (pista.name.endsWith('Hips.position')) {
        const v = pista.values;
        const x0 = v[0];
        const z0 = v[2];
        for (let i = 0; i < v.length; i += 3) {
            v[i] = x0;
            v[i + 2] = z0;
        }
        }
    }
    }

    // Comprueba que los huesos que usa la animación existen en el personaje
    export function verificarEsqueleto(modelo, clip, nombre) {
    const faltantes = new Set();
    for (const pista of clip.tracks) {
        const hueso = pista.name.split('.')[0];
        if (!modelo.getObjectByName(hueso)) faltantes.add(hueso);
    }
    if (faltantes.size > 0) {
        console.warn(
        `La animación "${nombre}" usa huesos que el personaje no tiene (${faltantes.size}). ` +
        `Descárgala de Mixamo con el mismo personaje seleccionado. Ejemplo: ${[...faltantes][0]}`
        );
        return false;
    }
    return true;
    }

    export class AdministradorAnimaciones {
    constructor(mixer, clips) {
        this.mixer = mixer;
        this.acciones = {};
        this.actual = null;
        this.nombreActual = null;

        for (const [nombre, clip] of Object.entries(clips)) {
        const accion = mixer.clipAction(clip);
        if (nombre === 'jump') {
            accion.setLoop(THREE.LoopOnce, 1);
            accion.clampWhenFinished = true;
        } else {
            accion.setLoop(THREE.LoopRepeat, Infinity);
        }
        this.acciones[nombre] = accion;
        }
    }

    reproducir(nombre, duracion = CONFIG.transicion, escalaTiempo = 1) {
        const siguiente = this.acciones[nombre];
        if (!siguiente) return;

        // Si ya es la animación activa no se reinicia, solo se ajusta la dirección
        if (this.nombreActual === nombre) {
        siguiente.setEffectiveTimeScale(escalaTiempo);
        return;
        }

        siguiente.reset();
        siguiente.setEffectiveTimeScale(escalaTiempo);
        siguiente.setEffectiveWeight(1);
        siguiente.play();
        if (this.actual) this.actual.crossFadeTo(siguiente, duracion, false);

        this.actual = siguiente;
        this.nombreActual = nombre;
    }

    actualizar(delta) {
        this.mixer.update(delta);
    }
    }