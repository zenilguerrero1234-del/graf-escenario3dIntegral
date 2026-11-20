    import * as THREE from 'three';
    import * as CANNON from 'cannon-es';

    const TOTAL_CRISTALES = 12;
    const TIEMPO_PARTIDA = 150;
    const RADIO_RECOGER = 1.3;
    const PUNTOS_CRISTAL = 100;
    const PUNTOS_GOL = 150;
    const BONO_POR_SEGUNDO = 5;
    const POSICION_PELOTA = { x: 2, y: 0.36, z: 4 };

    function crearAleatorio(semilla) {
    let a = semilla;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    }

    export class Juego {
    constructor({ scene, fisica, cuerpoPersonaje, sonido, ui, limite }) {
        this.scene = scene;
        this.fisica = fisica;
        this.cuerpoPersonaje = cuerpoPersonaje;
        this.sonido = sonido;
        this.ui = ui;

        this.modo = 'menu'; // menu, cristales, libre, fin
        this.puntos = 0;
        this.goles = 0;
        this.recogidos = 0;
        this.total = TOTAL_CRISTALES;
        this.tiempo = TIEMPO_PARTIDA;
        this.resultado = null;
        this.cristales = [];

        // La pelota es el único cuerpo dinámico con forma de esfera
        this.pelota = fisica.dinamicos.find((d) => d.cuerpo.shapes[0] instanceof CANNON.Sphere) || null;
        this.zPorteria = -(limite - 6);

        this.crearCristales(limite);
        this.crearPorteria();
    }

    crearCristales(limite) {
        const azar = crearAleatorio(777);
        const obstaculos = this.fisica.world.bodies.filter(
        (b) => b !== this.cuerpoPersonaje && b.boundingRadius < 5
        );
        const geometria = new THREE.OctahedronGeometry(0.28, 0);
        const materiales = [
        new THREE.MeshStandardMaterial({ color: 0x5ff2ff, emissive: 0x20c5ff, emissiveIntensity: 1.6, roughness: 0.2 }),
        new THREE.MeshStandardMaterial({ color: 0xffd37a, emissive: 0xffa927, emissiveIntensity: 1.6, roughness: 0.2 })
        ];

        let intentos = 0;
        while (this.cristales.length < TOTAL_CRISTALES && intentos < 800) {
        intentos++;
        const x = (azar() * 2 - 1) * (limite - 3);
        const z = (azar() * 2 - 1) * (limite - 3);
        if (Math.hypot(x, z) < 4) continue;
        if (Math.abs(x) < 5 && z < this.zPorteria + 4) continue; // zona de la portería
        if (obstaculos.some((b) => Math.hypot(b.position.x - x, b.position.z - z) < b.boundingRadius + 1.1)) continue;
        if (this.cristales.some((c) => Math.hypot(c.malla.position.x - x, c.malla.position.z - z) < 4)) continue;

        const malla = new THREE.Mesh(geometria, materiales[this.cristales.length % 2]);
        malla.scale.set(1, 1.6, 1);
        malla.position.set(x, 1.1, z);
        malla.visible = false;
        this.scene.add(malla);
        this.cristales.push({ malla, recogido: false, fase: azar() * Math.PI * 2 });
        }
        this.total = this.cristales.length;
    }

    crearPorteria() {
        const grupo = new THREE.Group();
        const madera = new THREE.MeshStandardMaterial({ color: 0xf1ede2, roughness: 0.6 });

        for (const lado of [-2.2, 2.2]) {
        const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 12), madera);
        poste.position.set(lado, 1.1, 0);
        poste.castShadow = true;
        grupo.add(poste);
        }
        const larguero = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.4, 12), madera);
        larguero.rotation.z = Math.PI / 2;
        larguero.position.set(0, 2.2, 0);
        larguero.castShadow = true;
        grupo.add(larguero);

        const zona = new THREE.Mesh(
        new THREE.PlaneGeometry(4.4, 2.4),
        new THREE.MeshBasicMaterial({ color: 0x6dffa8, transparent: true, opacity: 0.28, depthWrite: false })
        );
        zona.rotation.x = -Math.PI / 2;
        zona.position.set(0, 0.03, -0.4);
        grupo.add(zona);

        grupo.position.set(0, 0, this.zPorteria);
        this.scene.add(grupo);
    }

    iniciar(modo) {
        this.modo = modo;
        this.puntos = 0;
        this.goles = 0;
        this.recogidos = 0;
        this.tiempo = TIEMPO_PARTIDA;
        this.resultado = null;
        for (const c of this.cristales) {
        c.recogido = false;
        c.malla.visible = modo === 'cristales';
        }
        this.reponerPelota();
        this.sonido.inicio();
        this.ui.mostrarAviso(
        modo === 'cristales'
            ? `Recoge los ${this.total} cristales antes de que se acabe el tiempo`
            : 'Modo libre: explora, empuja cajas y marca goles',
        3500
        );
        this.ui.actualizarHUD(this.datosHUD());
    }

    reponerPelota() {
        if (!this.pelota) return;
        const cuerpo = this.pelota.cuerpo;
        cuerpo.position.set(POSICION_PELOTA.x, POSICION_PELOTA.y, POSICION_PELOTA.z);
        cuerpo.velocity.set(0, 0, 0);
        cuerpo.angularVelocity.set(0, 0, 0);
        cuerpo.quaternion.set(0, 0, 0, 1);
    }

    animar(t) {
        for (const c of this.cristales) {
        if (!c.malla.visible) continue;
        c.malla.rotation.y = t * 1.5 + c.fase;
        c.malla.position.y = 1.1 + Math.sin(t * 2 + c.fase) * 0.15;
        }
    }

    revisarCristales() {
        const p = this.cuerpoPersonaje.position;
        for (const c of this.cristales) {
        if (c.recogido) continue;
        const m = c.malla.position;
        if (Math.hypot(p.x - m.x, p.y - m.y, p.z - m.z) < RADIO_RECOGER) {
            c.recogido = true;
            c.malla.visible = false;
            this.recogidos++;
            this.puntos += PUNTOS_CRISTAL;
            this.sonido.cristal();
            this.ui.mostrarAviso(`Cristal ${this.recogidos} de ${this.total}`, 1200);
        }
        }
    }

    revisarGol() {
        if (!this.pelota) return;
        const p = this.pelota.cuerpo.position;
        const dentro = Math.abs(p.x) < 2.0 && p.y < 2.4 && p.z < this.zPorteria + 0.8 && p.z > this.zPorteria - 1.6;
        if (!dentro) return;
        this.goles++;
        this.puntos += PUNTOS_GOL;
        this.sonido.gol();
        this.ui.mostrarAviso('¡Gol!', 1800);
        this.reponerPelota();
    }

    actualizar(delta, t) {
        this.animar(t);
        this.revisarGol();
        if (this.modo === 'cristales') {
        this.tiempo = Math.max(0, this.tiempo - delta);
        this.revisarCristales();
        if (this.recogidos >= this.total) this.terminar(true);
        else if (this.tiempo <= 0) this.terminar(false);
        }
        this.ui.actualizarHUD(this.datosHUD());
    }

    terminar(completado) {
        this.modo = 'fin';
        const bono = completado ? Math.ceil(this.tiempo) * BONO_POR_SEGUNDO : 0;
        this.puntos += bono;
        const estrellas = this.puntos >= 1400 ? 3 : this.puntos >= 900 ? 2 : this.puntos >= 400 ? 1 : 0;
        this.resultado = {
        completado,
        estrellas,
        puntos: this.puntos,
        bono,
        recogidos: this.recogidos,
        total: this.total,
        goles: this.goles,
        tiempoUsado: Math.round(TIEMPO_PARTIDA - this.tiempo)
        };
        this.sonido.fin(completado);
        this.ui.mostrarResultado(this.resultado);
    }

    datosHUD() {
        return {
        modo: this.modo,
        tiempo: this.tiempo,
        recogidos: this.recogidos,
        total: this.total,
        puntos: this.puntos,
        goles: this.goles
        };
    }
    }