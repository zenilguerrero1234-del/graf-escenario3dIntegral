    import './style.css';
    import * as THREE from 'three';
    import { CONFIG } from './config.js';
    import { crearEscena } from './scene/createScene.js';
    import { cargarAmbiente } from './scene/createEnvironment.js';
    import { crearIluminacion } from './scene/createLighting.js';
    import { crearPiso } from './scene/createFloor.js';
    import { crearLuciernagas } from './scene/createFireflies.js';
    import { crearMundoFisico } from './physics/physicsWorld.js';
    import { crearSueloFisico, crearLimitesFisicos, crearCuerpoPersonaje } from './physics/collisions.js';
    import { crearObjetos } from './objects/createObjects.js';
    import { cargarPersonaje } from './character/createCharacter.js';
    import { ControlPersonaje } from './character/characterControls.js';
    import { crearControlesCamara } from './camera/cameraControls.js';
    import { Teclado } from './input/keyboard.js';
    import { Sonido } from './audio/sound.js';
    import { Juego } from './game/juego.js';
    import { GestorVR } from './vr/vrManager.js';
    import * as ui from './ui/interface.js';

    // El navegador de las Meta Quest se identifica como OculusBrowser
    const esQuest = /OculusBrowser|Quest/i.test(navigator.userAgent);

    async function iniciar() {
    const sonido = new Sonido();
    let juego = null;
    let control = null;
    let vr = null;
    let camara = null;

    const enPartida = () => juego && (juego.modo === 'cristales' || juego.modo === 'libre');

    function empezar(modo) {
        sonido.activar();
        ui.ocultarMenu();
        ui.ocultarResultado();
        control.reiniciar();
        juego.iniciar(modo);
        ui.mostrarHUD(true);
    }

    function abrirMenu() {
        if (!juego || (vr && vr.activo) || ui.resultadoAbierto()) return;
        if (ui.menuAbierto() && enPartida()) ui.ocultarMenu();
        else ui.mostrarMenu({ puedeContinuar: enPartida() });
    }

    ui.iniciarInterfaz({
        alJugar: () => empezar('cristales'),
        alLibre: () => empezar('libre'),
        alContinuar: () => ui.ocultarMenu(),
        alVR: () => {
        sonido.activar();
        if (vr) vr.iniciar();
        },
        alReiniciar: () => empezar('cristales'),
        alVolverMenu: () => {
        ui.ocultarResultado();
        juego.modo = 'menu';
        ui.mostrarHUD(false);
        ui.mostrarMenu({ puedeContinuar: false });
        },
        alAbrirMenu: abrirMenu,
        alSonido: () => sonido.alternar()
    });

    const contenedor = document.getElementById('app');
    const { scene, camera, renderer, liberar, redimensionar } = crearEscena(contenedor, {
        ratioMax: esQuest ? 1 : 2
    });
    crearIluminacion(scene, CONFIG.limite, { sombras: esQuest ? 1024 : 2048 });
    const luciernagas = crearLuciernagas(scene, CONFIG.limite, esQuest ? 60 : 140);

    const fisica = crearMundoFisico();
    crearSueloFisico(fisica);
    crearLimitesFisicos(fisica, CONFIG.limite);
    crearObjetos(scene, fisica, CONFIG.limite);
    const cuerpo = crearCuerpoPersonaje(fisica, CONFIG.inicio.x, CONFIG.inicio.z);

    camara = crearControlesCamara(camera, renderer.domElement);
    const teclado = new Teclado();
    teclado.alPulsar(['KeyM', 'Escape'], abrirMenu);

    let terminados = 0;
    const avanzar = (texto) => {
        terminados++;
        ui.actualizarProgreso(terminados / 3, texto);
    };
    ui.actualizarProgreso(0.05, 'Cargando ambiente, piso y personaje…');

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
        ui.mostrarError(
        `No se pudo cargar el personaje o sus animaciones: ${error.message}. ` +
        'Revisa que los archivos estén en public/assets/models y public/assets/animations con los nombres correctos.'
        );
        return;
    }

    control = new ControlPersonaje({
        modelo: personaje.modelo,
        animaciones: personaje.animaciones,
        cuerpo,
        mundo: fisica.world,
        teclado,
        ajusteY: personaje.ajusteY,
        luz: personaje.luz
    });

    juego = new Juego({ scene, fisica, cuerpoPersonaje: cuerpo, sonido, ui, limite: CONFIG.limite });

    vr = new GestorVR({
        renderer,
        scene,
        camera,
        alIniciar: () => {
        ui.ocultarMenu();
        ui.ocultarResultado();
        if (!enPartida()) empezar('cristales');
        },
        alTerminar: () => {
        redimensionar();
        const p = cuerpo.position;
        camera.position.set(p.x, 3.5, p.z - 7);
        camara.controls.target.set(p.x, 1.2, p.z);
        camara.controls.update();
        ui.mostrarMenu({ puedeContinuar: enPartida() });
        },
        alReiniciar: () => empezar('cristales')
    });

    const soporte = await GestorVR.comprobar();
    ui.setEstadoVR(soporte.ok, soporte.motivo);

    ui.ocultarCarga();

    const reloj = new THREE.Clock();
    let t = 0;

    // setAnimationLoop (y no requestAnimationFrame) es lo que permite usar las gafas VR
    renderer.setAnimationLoop(() => {
        const delta = Math.min(reloj.getDelta(), 0.1);
        t += delta;

        const pantallaDelante = !vr.activo && ui.pantallaAbierta();
        control.bloqueado = !enPartida() || pantallaDelante;

        control.update(delta);
        fisica.actualizar(delta);
        control.sincronizar(delta);

        if (enPartida() && !pantallaDelante) juego.actualizar(delta, t);
        else juego.animar(t);
        luciernagas.actualizar(t);

        if (vr.activo) {
        camara.controls.enabled = false;
        vr.actualizar(control, juego);
        } else {
        camara.controls.enabled = true;
        camara.controls.autoRotate = juego.modo === 'menu';
        camara.controls.autoRotateSpeed = 0.8;
        camara.seguir(personaje.modelo.position, delta);
        }

        renderer.render(scene, camera);
    });

    window.addEventListener('beforeunload', () => {
        renderer.setAnimationLoop(null);
        teclado.liberar();
        liberar();
    });
    }

    iniciar();