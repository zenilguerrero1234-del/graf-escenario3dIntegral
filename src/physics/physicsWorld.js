    import * as CANNON from 'cannon-es';

    export function crearMundoFisico() {
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
    world.allowSleep = false;
    world.defaultContactMaterial.friction = 0.35;
    world.defaultContactMaterial.restitution = 0.05;

    const materiales = {
        suelo: new CANNON.Material('suelo'),
        personaje: new CANNON.Material('personaje'),
        objeto: new CANNON.Material('objeto'),
        pelota: new CANNON.Material('pelota')
    };

    const par = (a, b, friccion, rebote) => {
        world.addContactMaterial(new CANNON.ContactMaterial(a, b, { friction: friccion, restitution: rebote }));
    };
    par(materiales.personaje, materiales.suelo, 0, 0);
    par(materiales.personaje, materiales.objeto, 0.02, 0);
    par(materiales.personaje, materiales.pelota, 0.02, 0.3);
    par(materiales.objeto, materiales.suelo, 0.55, 0.05);
    par(materiales.objeto, materiales.objeto, 0.45, 0.05);
    par(materiales.pelota, materiales.suelo, 0.25, 0.65);
    par(materiales.pelota, materiales.objeto, 0.3, 0.4);

    const dinamicos = [];

    return {
        world,
        materiales,
        dinamicos,

        registrarDinamico(malla, cuerpo) {
        dinamicos.push({
            malla,
            cuerpo,
            posInicial: cuerpo.position.clone(),
            rotInicial: cuerpo.quaternion.clone()
        });
        },

        actualizar(delta) {
        world.step(1 / 60, Math.min(delta, 0.1), 3);
        for (const d of dinamicos) {
            if (d.cuerpo.position.y < -10) {
            d.cuerpo.position.copy(d.posInicial);
            d.cuerpo.quaternion.copy(d.rotInicial);
            d.cuerpo.velocity.set(0, 0, 0);
            d.cuerpo.angularVelocity.set(0, 0, 0);
            }
            d.malla.position.copy(d.cuerpo.position);
            d.malla.quaternion.copy(d.cuerpo.quaternion);
        }
        }
    };
    }