    import * as CANNON from 'cannon-es';

    export function agregarEstatico(fisica, forma, x, y, z, giroY = 0) {
    const cuerpo = new CANNON.Body({ mass: 0, material: fisica.materiales.suelo });
    cuerpo.addShape(forma);
    cuerpo.position.set(x, y, z);
    if (giroY !== 0) cuerpo.quaternion.setFromEuler(0, giroY, 0);
    fisica.world.addBody(cuerpo);
    return cuerpo;
    }

    export function agregarDinamico(fisica, malla, forma, opciones = {}) {
    const { masa = 5, material = fisica.materiales.objeto, amortiguacion = 0.05, amortiguacionAngular = 0.1 } = opciones;
    const cuerpo = new CANNON.Body({
        mass: masa,
        material,
        linearDamping: amortiguacion,
        angularDamping: amortiguacionAngular
    });
    cuerpo.addShape(forma);
    cuerpo.position.copy(malla.position);
    cuerpo.quaternion.copy(malla.quaternion);
    fisica.world.addBody(cuerpo);
    fisica.registrarDinamico(malla, cuerpo);
    return cuerpo;
    }