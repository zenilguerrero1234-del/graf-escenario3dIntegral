    import * as THREE from 'three';
    import { CONFIG } from '../config.js';
    import { actualizarEstado } from '../ui/interface.js';
    import { estaEnSuelo } from '../physics/collisions.js';

    const NOMBRES = { idle: 'Reposo', walk: 'Caminar', run: 'Correr', dance: 'Bailar', jump: 'Saltar' };

    export class ControlPersonaje {
    constructor({ modelo, animaciones, cuerpo, mundo, teclado, ajusteY }) {
        this.modelo = modelo;
        this.animaciones = animaciones;
        this.cuerpo = cuerpo;
        this.mundo = mundo;
        this.teclado = teclado;
        this.ajusteY = ajusteY;

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

        teclado.alPulsar(['Digit1', 'Numpad1'], () => this.elegirLocomocion('walk'));
        teclado.alPulsar(['Digit2', 'Numpad2'], () => this.elegirLocomocion('run'));
        teclado.alPulsar(['Digit3', 'Numpad3'], () => { this.bailando = !this.bailando; });
        teclado.alPulsar(['Space'], () => this.saltar());
        teclado.alPulsar(['KeyE'], () => { this.grados += 90; });
        teclado.alPulsar(['KeyP'], () => { this.enMarcha = !this.enMarcha; });

        this.sincronizar(0);
    }

    elegirLocomocion(nombre) {
        this.locomocion = nombre;
        this.bailando = false;
        this.vistaPrevia = 1.5;
    }

    saltar() {
        if (this.saltando || !this.enSuelo) return;
        this.saltando = true;
        this.tiempoSalto = 0;
        this.cuerpo.velocity.y = CONFIG.fuerzaSalto;
        this.animaciones.reproducir('jump', 0.1);
    }

    // Se llama antes de avanzar la física: decide velocidades y animación
    update(delta) {
        const t = this.teclado;
        const adelante = (t.estaPresionada('KeyW') ? 1 : 0) - (t.estaPresionada('KeyS') ? 1 : 0);
        const lateral = (t.estaPresionada('KeyD') ? 1 : 0) - (t.estaPresionada('KeyA') ? 1 : 0);
        const quiereMover = this.enMarcha && (adelante !== 0 || lateral !== 0);
        if (quiereMover && this.bailando) this.bailando = false;

        // Giro en pasos exactos de 90 grados
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