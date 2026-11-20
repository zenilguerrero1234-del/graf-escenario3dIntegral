    import * as THREE from 'three';
    import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
    import { crearPanelAyudaVR, crearPanelHUDVR } from './vrPanels.js';

    const DISTANCIA_ATRAS = 2.6; // metros que la vista queda detrás del personaje
    const GIRO_VR = 45; // grados por cada giro con el joystick derecho
    const ZONA_MUERTA = 0.2;

    const sinZonaMuerta = (v) => (Math.abs(v) < ZONA_MUERTA ? 0 : v);

    // Índices de botones del perfil "xr-standard" de los mandos Quest
    const BOTON = { GATILLO: 0, AGARRE: 1, JOYSTICK: 3, A_X: 4, B_Y: 5 };

    export class GestorVR {
    constructor({ renderer, scene, camera, alIniciar, alTerminar, alReiniciar }) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.alIniciar = alIniciar;
        this.alTerminar = alTerminar;
        this.alReiniciar = alReiniciar;

        this.activo = false;
        this.sesion = null;
        this.giroListo = true;
        this.previos = { left: [], right: [] };

        // La "plataforma" se mueve con el personaje y la cabeza se mueve dentro de ella
        this.rig = new THREE.Group();
        this.rig.name = 'rigVR';
        scene.add(this.rig);

        this.panelAyuda = crearPanelAyudaVR();
        this.panelAyuda.malla.position.set(-1.35, 1.5, -1.3);
        this.panelAyuda.malla.rotation.y = 0.55;
        this.rig.add(this.panelAyuda.malla);

        this.panelHUD = crearPanelHUDVR();
        this.panelHUD.malla.position.set(0, 0.34, -1.2);

        this.crearControladores();
    }

    static async comprobar() {
        if (!('xr' in navigator)) {
        return { ok: false, motivo: 'Este navegador no ofrece WebXR. En las Meta Quest abre esta dirección con su navegador.' };
        }
        try {
        const ok = await navigator.xr.isSessionSupported('immersive-vr');
        return ok
            ? { ok: true, motivo: 'Visor de VR detectado. Pulsa el botón para entrar.' }
            : { ok: false, motivo: 'No se detectó un visor de VR. En las Meta Quest abre esta misma dirección con su navegador.' };
        } catch (error) {
        return { ok: false, motivo: 'No se pudo comprobar la compatibilidad con VR.' };
        }
    }

    crearControladores() {
        const fabrica = new XRControllerModelFactory();
        for (const i of [0, 1]) {
        const agarre = this.renderer.xr.getControllerGrip(i);
        agarre.add(fabrica.createControllerModel(agarre));
        this.rig.add(agarre);
        this.rig.add(this.renderer.xr.getController(i));
        }
    }

    async iniciar() {
        if (this.activo) return;
        try {
        const sesion = await navigator.xr.requestSession('immersive-vr', {
            optionalFeatures: ['local-floor', 'bounded-floor']
        });
        sesion.addEventListener('end', () => this.terminarSesion());
        await this.renderer.xr.setSession(sesion);
        this.sesion = sesion;
        this.activo = true;

        this.rig.add(this.camera);
        this.camera.add(this.panelHUD.malla);
        this.panelHUD.malla.visible = true;
        this.panelAyuda.malla.visible = true;
        this.alIniciar();
        } catch (error) {
        console.warn('No se pudo iniciar la sesión de VR.', error);
        }
    }

    terminarSesion() {
        this.activo = false;
        this.sesion = null;
        this.panelHUD.malla.visible = false;
        this.panelAyuda.malla.visible = false;
        this.camera.remove(this.panelHUD.malla);
        this.rig.remove(this.camera);
        this.alTerminar();
    }

    actualizar(personaje, juego) {
        if (!this.activo || !this.sesion) return;

        // La vista se coloca detrás del personaje y gira en pasos, sin deslizarse
        const yaw = THREE.MathUtils.degToRad(personaje.grados);
        const p = personaje.cuerpo.position;
        this.rig.position.set(p.x - Math.sin(yaw) * DISTANCIA_ATRAS, 0, p.z - Math.cos(yaw) * DISTANCIA_ATRAS);
        this.rig.rotation.y = yaw + Math.PI;

        let adelante = 0;
        let lateral = 0;

        for (const fuente of this.sesion.inputSources) {
        const mando = fuente.gamepad;
        if (!mando) continue;
        const mano = fuente.handedness;
        if (mano !== 'left' && mano !== 'right') continue;

        const ejes = mando.axes;
        const botones = mando.buttons;
        const ejeX = ejes.length > 2 ? ejes[2] : ejes[0];
        const ejeY = ejes.length > 3 ? ejes[3] : ejes[1];

        const previo = this.previos[mano];
        const pulsado = (i) => !!botones[i] && botones[i].pressed && !previo[i];
        const vibrar = (fuerza = 0.5, ms = 60) => {
            try {
            const actuador = mando.hapticActuators && mando.hapticActuators[0];
            if (actuador && actuador.pulse) actuador.pulse(fuerza, ms);
            } catch (error) {
            // No todos los navegadores ofrecen vibración
            }
        };

        // Los dos joysticks tienen una función cada uno
        if (mano === 'left') {
            lateral = sinZonaMuerta(ejeX);
            adelante = -sinZonaMuerta(ejeY);
        } else if (Math.abs(ejeX) > 0.7 && this.giroListo) {
            personaje.girar(ejeX > 0 ? GIRO_VR : -GIRO_VR);
            this.giroListo = false;
        } else if (mano === 'right' && Math.abs(ejeX) < 0.3) {
            this.giroListo = true;
        }

        if (juego.modo === 'fin') {
            // Con la partida terminada, el gatillo o el botón A empiezan otra
            if (pulsado(BOTON.GATILLO) || (mano === 'right' && pulsado(BOTON.A_X))) this.alReiniciar();
        } else {
            if (pulsado(BOTON.JOYSTICK)) personaje.alternarMarcha();
            if (pulsado(BOTON.AGARRE)) {
            personaje.agarrar();
            vibrar(0.5, 60);
            }
            if (mano === 'left') {
            if (pulsado(BOTON.A_X)) personaje.alternarLocomocion(); // botón X
            if (pulsado(BOTON.B_Y)) this.panelAyuda.malla.visible = !this.panelAyuda.malla.visible; // botón Y
            if (pulsado(BOTON.GATILLO)) {
                personaje.pulso();
                vibrar(0.7, 120);
            }
            } else {
            if (pulsado(BOTON.A_X)) personaje.saltar(); // botón A
            if (pulsado(BOTON.B_Y)) personaje.alternarBaile(); // botón B
            if (pulsado(BOTON.GATILLO)) {
                personaje.patear();
                vibrar(0.9, 80);
            }
            }
        }

        for (let i = 0; i < botones.length; i++) previo[i] = botones[i].pressed;
        }

        personaje.entradaExtra.adelante = adelante;
        personaje.entradaExtra.lateral = lateral;
        this.panelHUD.actualizar(juego);
    }
    }