    import './style.css';
    import * as THREE from 'three';
    import { CONFIG } from './config.js';
    import { crearEscena } from './scene/createScene.js';
    import { cargarAmbiente } from './scene/createEnvironment.js';
    import { crearIluminacion } from './scene/createLighting.js';
    import { crearPiso } from './scene/createFloor.js';
    import { crearMundoFisico } from './physics/physicsWorld.js';
    import { crearSueloFisico, crearLimitesFisicos, crearCuerpoPersonaje } from './physics/collisions.js';
    import { crearObjetos } from './objects/createObjects.js';
    import { cargarPersonaje } from './character/createCharacter.js';
    import { ControlPersonaje } from './character/characterControls.js';
    import { crearControlesCamara } from './camera/cameraControls.js';
    import { Teclado } from './input/keyboard.js';
    import { iniciarInterfaz, actualizarProgreso, ocultarCarga, mostrarError } from './ui/interface.js';

    async function iniciar() {
    iniciarInterfaz();

    const contenedor = document.getElementById('app');
    const { scene, camera, renderer, liberar } = crearEscena(contenedor);
    crearIluminacion(scene, CONFIG.limite);

    const fisica = crearMundoFisico();
    crearSueloFisico(fisica);
    crearLimitesFisicos(fisica, CONFIG.limite);
    crearObjetos(scene, fisica, CONFIG.limite);
    const cuerpo = crearCuerpoPersonaje(fisica, CONFIG.inicio.x, CONFIG.inicio.z);

    const camara = crearControlesCamara(camera, renderer.domElement);
    const teclado = new Teclado();

    let terminados = 0;
    const avanzar = (texto) => {
        terminados++;
        actualizarProgreso(terminados / 3, texto);
    };
    actualizarProgreso(0.05, 'Cargando ambiente, piso y personaje…');

    let personaje;
    try {
        const resultados = await Promise.all([
        cargarAmbiente(scene).then(() => avanzar('Ambiente listo')),
        crearPiso(scene, renderer).then(() => avanzar('Piso listo')),
        cargarPersonaje(scene).then((p) => {
            avanzar('Personaje listo');
            return p;
        })
        ]);
        personaje = resultados[2];
    } catch (error) {
        console.error(error);
        mostrarError(
        `No se pudo cargar el personaje o sus animaciones: ${error.message}. ` +
        'Revisa que los archivos estén en public/assets/models y public/assets/animations con los nombres correctos.'
        );
        return;
    }

    const control = new ControlPersonaje({
        modelo: personaje.modelo,
        animaciones: personaje.animaciones,
        cuerpo,
        mundo: fisica.world,
        teclado,
        ajusteY: personaje.ajusteY
    });

    ocultarCarga();

    const reloj = new THREE.Clock();
    function bucle() {
        requestAnimationFrame(bucle);
        const delta = Math.min(reloj.getDelta(), 0.1);
        control.update(delta);
        fisica.actualizar(delta);
        control.sincronizar(delta);
        camara.seguir(personaje.modelo.position, delta);
        renderer.render(scene, camera);
    }
    bucle();

    window.addEventListener('beforeunload', () => {
        teclado.liberar();
        liberar();
    });
    }

    iniciar();