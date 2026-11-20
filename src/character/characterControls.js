    import * as THREE from 'three';
    import { CONFIG } from '../config.js';
    import { actualizarEstado } from '../ui/interface.js';
    import { estaEnSuelo } from '../physics/collisions.js';

    const NOMBRES = { idle: 'Reposo', walk: 'Caminar', run: 'Correr', dance: 'Bailar', jump: 'Saltar' };
    const VELOCIDAD_GIRO_MODELO = 14; // radianes por segundo con que el personaje se voltea

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
        this.grados = 0; // orientación base, la cambia la tecla E
        this.yaw = 0; // la orientación base suavizada
        this.mirada = 0; // hacia dónde mira realmente el modelo
        this.miradaObjetivo = 0;
        this.enSuelo = false;
        this.direccion = new THREE.Vector3();
        this.ultimoEstado = '';

        // Cuando es true (menú abierto, partida terminada) se ignoran las órdenes
        this.bloqueado = false;
        // Movimiento que llega desde otros mandos (las gafas VR)
        this.entradaExtra = { adelante: 0, lateral: 0 };
        // Acciones de juego, las conecta main.js
        this.acciones = { agarrar: () => {}, patear: () => {}, pulso: () => {} };

        teclado.alPulsar(['Digit1', 'Numpad1'], () => this.elegirLocomocion('walk'));
        teclado.alPulsar(['Digit2', 'Numpad2'], () => this.elegirLocomocion('run'));
        teclado.alPulsar(['Digit3', 'Numpad3'], () => this.alternarBaile());
        teclado.alPulsar(['Space'], () => this.saltar());
        teclado.alPulsar(['KeyE'], () => this.girar(90));
        teclado.alPulsar(['KeyP'], () => this.alternarMarcha());
        teclado.alPulsar(['KeyF'], () => this.agarrar());
        teclado.alPulsar(['KeyQ'], () => this.patear());
        teclado.alPulsar(['KeyR'], () => this.pulso());

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
        this.miradaObjetivo = THREE.MathUtils.degToRad(this.grados);
    }

    saltar() {
        if (this.bloqueado || this.saltando || !this.enSuelo) return;
        this.saltando = true;
        this.tiempoSalto = 0;
        this.cuerpo.velocity.y = CONFIG.fuerzaSalto;
        this.animaciones.reproducir('jump', 0.1);
    }

    agarrar() {
        if (!this.bloqueado) this.acciones.agarrar();
    }

    patear() {
        if (!this.bloqueado) this.acciones.patear();
    }

    pulso() {
        if (!this.bloqueado) this.acciones.pulso();
    }

    // Devuelve al personaje al punto de inicio (al empezar una partida)
    reiniciar() {
        this.cuerpo.position.set(CONFIG.inicio.x, CONFIG.alturaPersonaje / 2 + 0.02, CONFIG.inicio.z);
        this.cuerpo.velocity.set(0, 0, 0);
        this.grados = 0;
        this.yaw = 0;
        this.mirada = 0;
        this.miradaObjetivo = 0;
        this.bailando = false;
        this.enMarcha = true;
        this.saltando = false;
        this.locomocion = 'walk';
        this.vistaPrevia = 0;
    }

    // Se llama antes de avanzar la física: decide velocidades y animación
    update(delta) {
        const t = this.teclado;
        let adelante =
        (t.estaPresionada('ArrowUp') ? 1 : 0) - (t.estaPresionada('ArrowDown') ? 1 : 0) + this.entradaExtra.adelante;
        let lateral =
        (t.estaPresionada('ArrowRight') ? 1 : 0) - (t.estaPresionada('ArrowLeft') ? 1 : 0) + this.entradaExtra.lateral;
        adelante = THREE.MathUtils.clamp(adelante, -1, 1);
        lateral = THREE.MathUtils.clamp(lateral, -1, 1);
        if (this.bloqueado) {
        adelante = 0;
        lateral = 0;
        }

        const quiereMover = this.enMarcha && (adelante !== 0 || lateral !== 0);
        if (quiereMover && this.bailando) this.bailando = false;

        // Orientación base suavizada
        const objetivo = THREE.MathUtils.degToRad(this.grados);
        const diferencia = objetivo - this.yaw;
        const paso = CONFIG.velocidadGiro * delta;
        if (Math.abs(diferencia) <= paso) this.yaw = objetivo;
        else this.yaw += Math.sign(diferencia) * paso;

        // Dirección de movimiento respecto a la orientación base
        this.direccion.set(0, 0, 0);
        if (quiereMover) {
        const sen = Math.sin(this.yaw);
        const cos = Math.cos(this.yaw);
        this.direccion.set(sen * adelante - cos * lateral, 0, cos * adelante + sen * lateral).normalize();
        // El personaje se voltea hacia donde se mueve
        this.miradaObjetivo = Math.atan2(this.direccion.x, this.direccion.z);
        }

        const dif = Math.atan2(Math.sin(this.miradaObjetivo - this.mirada), Math.cos(this.miradaObjetivo - this.mirada));
        const pasoModelo = VELOCIDAD_GIRO_MODELO * delta;
        this.mirada += Math.abs(dif) <= pasoModelo ? dif : Math.sign(dif) * pasoModelo;

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
        if (this.saltando) {
        nombre = 'jump';
        } else if (this.bailando) {
        nombre = 'dance';
        } else if (quiereMover) {
        nombre = this.locomocion;
        } else if (this.enMarcha && this.vistaPrevia > 0) {
        nombre = this.locomocion;
        }
        if (this.vistaPrevia > 0) this.vistaPrevia -= delta;
        this.animaciones.reproducir(nombre, CONFIG.transicion, 1);
    }

    // Se llama después de la física: copia el cuerpo al modelo y avanza el mixer
    sincronizar(delta) {
        this.enSuelo = estaEnSuelo(this.mundo, this.cuerpo);
        const c = this.cuerpo.position;
        this.modelo.position.set(c.x, c.y - CONFIG.alturaPersonaje / 2 + this.ajusteY, c.z);
        this.modelo.rotation.y = this.mirada;
        if (this.luz) {
        this.luz.position.set(c.x - Math.sin(this.mirada) * 1.2, c.y + 2.2, c.z - Math.cos(this.mirada) * 1.2);
        }
        this.animaciones.actualizar(delta);
        this.mostrarEstado();
    }

    mostrarEstado() {
        const etiqueta = NOMBRES[this.animaciones.nombreActual] || 'Reposo';
        const rotacion = Math.round(THREE.MathUtils.radToDeg(this.miradaObjetivo));
        const clave = `${etiqueta}|${this.enMarcha}|${rotacion}`;
        if (clave === this.ultimoEstado) return;
        this.ultimoEstado = clave;
        actualizarEstado({ animacion: etiqueta, movimiento: this.enMarcha, rotacion });
    }
    }