    import * as CANNON from 'cannon-es';
    import { CONFIG } from '../config.js';

    export function crearSueloFisico(fisica) {
    const suelo = new CANNON.Body({ mass: 0, material: fisica.materiales.suelo });
    suelo.addShape(new CANNON.Plane());
    suelo.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    fisica.world.addBody(suelo);
    return suelo;
    }

    export function crearLimitesFisicos(fisica, limite) {
    const grosor = 0.5;
    const alto = 4;
    const largo = limite + 1;
    const muros = [
        { medidas: [largo, alto, grosor], pos: [0, alto, -(limite + grosor)] },
        { medidas: [largo, alto, grosor], pos: [0, alto, limite + grosor] },
        { medidas: [grosor, alto, largo], pos: [-(limite + grosor), alto, 0] },
        { medidas: [grosor, alto, largo], pos: [limite + grosor, alto, 0] }
    ];
    for (const muro of muros) {
        const cuerpo = new CANNON.Body({ mass: 0, material: fisica.materiales.suelo });
        cuerpo.addShape(new CANNON.Box(new CANNON.Vec3(...muro.medidas)));
        cuerpo.position.set(...muro.pos);
        fisica.world.addBody(cuerpo);
    }
    }

    export function crearCuerpoPersonaje(fisica, x, z) {
    const radio = CONFIG.radioCapsula;
    const mitad = CONFIG.alturaPersonaje / 2;
    const cuerpo = new CANNON.Body({
        mass: 70,
        material: fisica.materiales.personaje,
        fixedRotation: true,
        linearDamping: 0.01
    });
    const esfera = new CANNON.Sphere(radio);
    cuerpo.addShape(esfera, new CANNON.Vec3(0, -(mitad - radio), 0));
    cuerpo.addShape(esfera, new CANNON.Vec3(0, mitad - radio, 0));
    cuerpo.position.set(x, mitad + 0.02, z);
    cuerpo.updateMassProperties();
    fisica.world.addBody(cuerpo);
    return cuerpo;
    }

    export function estaEnSuelo(world, cuerpo) {
    for (const contacto of world.contacts) {
        let haciaArriba;
        if (contacto.bi === cuerpo) haciaArriba = -contacto.ni.y;
        else if (contacto.bj === cuerpo) haciaArriba = contacto.ni.y;
        else continue;
        if (haciaArriba > 0.5) return true;
    }
    return false;
    }