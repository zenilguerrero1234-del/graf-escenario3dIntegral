    import * as THREE from 'three';
    import { CONFIG } from '../config.js';
    import { actualizarEstado } from '../ui/interface.js';
    import { estaEnSuelo } from '../physics/collisions.js';

    const NOMBRES = { idle: 'Reposo', walk: 'Caminar', run: 'Correr', dance: 'Bailar', jump: 'Saltar' };

    export class ControlPersonaje {
    constructor({ modelo, animaciones, cuerpo, mundo, teclado, ajusteY, luz }) {
        this.modelo = modelo;
        this.animaciones = animaciones;
        this.cuerpo = cuerpo;
        this.mundo = mundo;
        this.teclado = teclado;
        this.ajusteY = ajusteY;
        this.luz = luz || null;

        this.locomocion = 'walk';
        this.bailando = false;
        this.enMarcha = true;
        this.saltando = false;
        this.tiempoSalto = 0;
        this.vistaPrevia = 0;
        this.grados = 0;
        this.yaw = 0;
        this.enSuelo = false;
        this.direccion = new THREE.Vector3();
        this.ultimoEstado = '';

        // Cuando es true (menú abierto, partida terminada) se ignoran las órdenes
        this.bloqueado = false;
        // Movimiento que llega desde otros mandos (las gafas VR)
        this.entradaExtra = { adelante: 0, lateral: 0 };

        teclado.alPulsar(['Digit1', 'Numpad1'], () => this.elegirLocomocion('walk'));
        teclado.alPulsar(['Digit2', 'Numpad2'], () => this.elegirLocomocion('run'));
        teclado.alPulsar(['Digit3', 'Numpad3'], () => this.alternarBaile());
        teclado.alPulsar(['Space'], () => this.saltar());
        teclado.alPulsar(['KeyE'], () => this.girar(90));
        teclado.alPulsar(['KeyP'], () => this.alternarMarcha());

        this.sincronizar(0);
    }

    elegirLocomocion(nombre) {
        if (this.bloqueado) return;
        this.locomocion = nombre;
        this.bailando = false;
        this.vistaPrevia = 1.5;
    }

    alternarLocomocion() {
        this.elegirLocomocion(this.locomocion === 'walk' ? 'run' : 'walk');
    }

    alternarBaile() {
        if (this.bloqueado) return;
        this.bailando = !this.bailando;
    }

    alternarMarcha() {
        if (this.bloqueado) return;
        this.enMarcha = !this.enMarcha;
    }

    girar(grados) {
        if (this.bloqueado) return;
        this.grados += grados;
    }

    saltar() {
        if (this.bloqueado || this.saltando || !this.enSuelo) return;
        this.saltando = true;
        this.tiempoSalto = 0;
        this.cuerpo.velocity.y = CONFIG.fuerzaSalto;
        this.animaciones.reproducir('jump', 0.1);
    }

    // Devuelve al personaje al punto de inicio (al empezar una partida)
    reiniciar() {
        this.cuerpo.position.set(CONFIG.inicio.x, CONFIG.alturaPersonaje / 2 + 0.02, CONFIG.inicio.z);
        this.cuerpo.velocity.set(0, 0, 0);
        this.grados = 0;
        this.yaw = 0;
        this.bailando = false;
        this.enMarcha = true;
        this.saltando = false;
        this.locomocion = 'walk';
        this.vistaPrevia = 0;
    }

    // Se llama antes de avanzar la física: decide velocidades y animación
    update(delta) {
        const t = this.teclado;
        let adelante = (t.estaPresionada('KeyW') ? 1 : 0) - (t.estaPresionada('KeyS') ? 1 : 0) + this.entradaExtra.adelante;
        let lateral = (t.estaPresionada('KeyD') ? 1 : 0) - (t.estaPresionada('KeyA') ? 1 : 0) + this.entradaExtra.lateral;
        adelante = THREE.MathUtils.clamp(adelante, -1, 1);
        lateral = THREE.MathUtils.clamp(lateral, -1, 1);
        if (this.bloqueado) {
        adelante = 0;
        lateral = 0;
        }

        const quiereMover = this.enMarcha && (adelante !== 0 || lateral !== 0);
        if (quiereMover && this.bailando) this.bailando = false;

        // Giro en pasos exactos
        const objetivo = THREE.MathUtils.degToRad(this.grados);
        const diferencia = objetivo - this.yaw;
        const paso = CONFIG.velocidadGiro * delta;
        if (Math.abs(diferencia) <= paso) this.yaw = objetivo;
        else this.yaw += Math.sign(diferencia) * paso;

        // Movimiento relativo a hacia dónde mira el personaje
        this.direccion.set(0, 0, 0);
        if (quiereMover) {
        const sen = Math.sin(this.yaw);
        const cos = Math.cos(this.yaw);
        this.direccion.set(sen * adelante - cos * lateral, 0, cos * adelante + sen * lateral).normalize();
        }
        const velocidad = this.locomocion === 'run' ? CONFIG.velocidadCorrer : CONFIG.velocidadCaminar;
        this.cuerpo.velocity.x = this.direccion.x * velocidad;
        this.cuerpo.velocity.z = this.direccion.z * velocidad;

        // Estado de salto: termina cuando vuelve a tocar el suelo
        if (this.saltando) {
        this.tiempoSalto += delta;
        if (this.tiempoSalto > 0.3 && this.enSuelo) this.saltando = false;
        }

        // Elección de animación
        let nombre = 'idle';
        let escala = 1;
        if (this.saltando) {
        nombre = 'jump';
        } else if (this.bailando) {
        nombre = 'dance';
        } else if (quiereMover) {
        nombre = this.locomocion;
        if (adelante < 0 && lateral === 0) escala = -1;
        } else if (this.enMarcha && this.vistaPrevia > 0) {
        nombre = this.locomocion;
        }
        if (this.vistaPrevia > 0) this.vistaPrevia -= delta;
        this.animaciones.reproducir(nombre, CONFIG.transicion, escala);
    }

    // Se llama después de la física: copia el cuerpo al modelo y avanza el mixer
    sincronizar(delta) {
        this.enSuelo = estaEnSuelo(this.mundo, this.cuerpo);
        const c = this.cuerpo.position;
        this.modelo.position.set(c.x, c.y - CONFIG.alturaPersonaje / 2 + this.ajusteY, c.z);
        this.modelo.rotation.y = this.yaw;
        if (this.luz) {
        this.luz.position.set(c.x - Math.sin(this.yaw) * 1.2, c.y + 2.2, c.z - Math.cos(this.yaw) * 1.2);
        }
        this.animaciones.actualizar(delta);
        this.mostrarEstado();
    }

    mostrarEstado() {
        const etiqueta = NOMBRES[this.animaciones.nombreActual] || 'Reposo';
        const clave = `${etiqueta}|${this.enMarcha}|${this.grados}`;
        if (clave === this.ultimoEstado) return;
        this.ultimoEstado = clave;
        actualizarEstado({ animacion: etiqueta, movimiento: this.enMarcha, rotacion: this.grados });
    }
    }