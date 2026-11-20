    import * as THREE from 'three';
    import * as CANNON from 'cannon-es';

    const TOTAL_CRISTALES = 12;
    const TIEMPO_PARTIDA = 150;
    const RADIO_RECOGER = 1.3;
    const PUNTOS_CRISTAL = 100;
    const PUNTOS_GOL = 150;
    const PUNTOS_PUZZLE = 400;
    const SEGUNDOS_PUZZLE = 20;
    const BONO_POR_SEGUNDO = 5;
    const ENFRIAMIENTO_PULSO = 8;
    const DURACION_PULSO = 1.6;
    const RADIO_PULSO = 9;
    const VENTANA_COMBO = 4;
    const POSICION_PELOTA = { x: 2, y: 0.36, z: 4 };
    const CLAVE_RECORD = 'brumaluz-record';

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
        this.limite = limite;
        this.control = null;

        this.modo = 'menu'; // menu, cristales, libre, fin
        this.puntos = 0;
        this.goles = 0;
        this.recogidos = 0;
        this.total = TOTAL_CRISTALES;
        this.tiempo = TIEMPO_PARTIDA;
        this.resultado = null;
        this.cristales = [];
        this.placas = [];
        this.placasActivas = 0;
        this.puzzleResuelto = false;
        this.agarrado = null;
        this.guardian = null;
        this.racha = 0;
        this.ultimoCristal = -99;
        this.tiempoPatada = 0;
        this.enfriamientoPulso = 0;
        this.pulsoActivo = 0;
        this.record = this.leerRecord();

        // La pelota es el único cuerpo dinámico con forma de esfera
        this.pelota = fisica.dinamicos.find((d) => d.cuerpo.shapes[0] instanceof CANNON.Sphere) || null;
        this.zPorteria = -(limite - 6);

        // Obstáculos pequeños (se excluyen suelo y muros) para no poner cosas encima
        this.obstaculos = fisica.world.bodies.filter((b) => b !== cuerpoPersonaje && b.boundingRadius < 5);

        const azar = crearAleatorio(777);
        const ocupados = [];
        this.crearPlacas(azar, ocupados);
        this.crearCristales(azar, ocupados);
        this.crearPorteria();
        this.crearGuardian();
        this.crearAnillo();

        this.ui.setRecord(this.record);
    }

    // El juego necesita saber hacia dónde mira el personaje
    vincular(control) {
        this.control = control;
    }

    /* ---------- Construcción del escenario de juego ---------- */

    buscarLugar(azar, ocupados, separacion) {
        const limite = this.limite;
        for (let i = 0; i < 800; i++) {
        const x = (azar() * 2 - 1) * (limite - 3);
        const z = (azar() * 2 - 1) * (limite - 3);
        if (Math.hypot(x, z) < 4) continue;
        if (Math.abs(x) < 5 && z < this.zPorteria + 5) continue; // zona de la portería
        if (this.obstaculos.some((b) => Math.hypot(b.position.x - x, b.position.z - z) < b.boundingRadius + 1.2)) continue;
        if (ocupados.some((o) => Math.hypot(o.x - x, o.z - z) < separacion)) continue;
        return { x, z };
        }
        return null;
    }

    crearPlacas(azar, ocupados) {
        const geometria = new THREE.CylinderGeometry(0.9, 0.9, 0.05, 28);
        const geometriaAro = new THREE.TorusGeometry(0.9, 0.05, 8, 36);
        const materialAro = new THREE.MeshStandardMaterial({ color: 0x7ff0ff, emissive: 0x20c5ff, emissiveIntensity: 1.2 });

        for (let i = 0; i < 3; i++) {
        const lugar = this.buscarLugar(azar, ocupados, 5);
        if (!lugar) break;
        ocupados.push(lugar);

        const material = new THREE.MeshStandardMaterial({
            color: 0x35505c,
            emissive: 0x0b2a3a,
            emissiveIntensity: 1,
            roughness: 0.5
        });
        const malla = new THREE.Mesh(geometria, material);
        malla.position.set(lugar.x, 0.025, lugar.z);
        malla.receiveShadow = true;
        this.scene.add(malla);

        const aro = new THREE.Mesh(geometriaAro, materialAro);
        aro.rotation.x = Math.PI / 2;
        aro.position.set(lugar.x, 0.06, lugar.z);
        this.scene.add(aro);

        this.placas.push({ x: lugar.x, z: lugar.z, malla, material, activa: false });
        }
    }

    crearCristales(azar, ocupados) {
        const geometria = new THREE.OctahedronGeometry(0.28, 0);
        const materiales = [
        new THREE.MeshStandardMaterial({ color: 0x5ff2ff, emissive: 0x20c5ff, emissiveIntensity: 1.6, roughness: 0.2 }),
        new THREE.MeshStandardMaterial({ color: 0xffd37a, emissive: 0xffa927, emissiveIntensity: 1.6, roughness: 0.2 })
        ];

        while (this.cristales.length < TOTAL_CRISTALES) {
        const lugar = this.buscarLugar(azar, ocupados, 4);
        if (!lugar) break;
        ocupados.push(lugar);

        const malla = new THREE.Mesh(geometria, materiales[this.cristales.length % 2]);
        malla.scale.set(1, 1.6, 1);
        malla.position.set(lugar.x, 1.1, lugar.z);
        malla.visible = false;
        this.scene.add(malla);
        this.cristales.push({ malla, recogido: false, fase: azar() * Math.PI * 2 });
        }
        this.total = this.cristales.length;
    }

    crearPorteria() {
        const grupo = new THREE.Group();
        const blanco = new THREE.MeshStandardMaterial({ color: 0xf1ede2, roughness: 0.6 });

        for (const lado of [-2.2, 2.2]) {
        const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 12), blanco);
        poste.position.set(lado, 1.1, 0);
        poste.castShadow = true;
        grupo.add(poste);
        }
        const larguero = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.4, 12), blanco);
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

    // Muro de piedra con un ojo brillante que se desliza frente a la portería
    crearGuardian() {
        const z = this.zPorteria + 2.3;
        const grupo = new THREE.Group();
        const piedra = new THREE.MeshStandardMaterial({ color: 0x6e756f, roughness: 1, flatShading: true });
        const muro = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.9, 0.5), piedra);
        muro.position.y = 0.95;
        muro.castShadow = true;
        muro.receiveShadow = true;
        const ojo = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0x5ff2ff, emissive: 0x20c5ff, emissiveIntensity: 2 })
        );
        ojo.position.set(0, 1.3, 0.28);
        grupo.add(muro, ojo);
        grupo.position.set(0, 0, z);
        this.scene.add(grupo);

        const cuerpo = new CANNON.Body({
        mass: 0,
        type: CANNON.Body.KINEMATIC,
        material: this.fisica.materiales.objeto
        });
        cuerpo.addShape(new CANNON.Box(new CANNON.Vec3(0.7, 0.95, 0.25)));
        cuerpo.position.set(0, 0.95, z);
        this.fisica.world.addBody(cuerpo);

        this.guardian = { grupo, cuerpo, direccion: 1 };
    }

    crearAnillo() {
        const material = new THREE.MeshBasicMaterial({
        color: 0x7ff0ff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
        });
        this.anillo = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 48), material);
        this.anillo.rotation.x = -Math.PI / 2;
        this.anillo.visible = false;
        this.scene.add(this.anillo);
    }

    /* ---------- Récord ---------- */

    leerRecord() {
        try {
        return Number(localStorage.getItem(CLAVE_RECORD)) || 0;
        } catch (error) {
        return 0;
        }
    }

    guardarRecord(valor) {
        try {
        localStorage.setItem(CLAVE_RECORD, String(valor));
        } catch (error) {
        // Si el navegador no permite guardar, el récord solo dura esta sesión
        }
    }

    /* ---------- Partida ---------- */

    iniciar(modo) {
        this.modo = modo;
        this.puntos = 0;
        this.goles = 0;
        this.recogidos = 0;
        this.tiempo = TIEMPO_PARTIDA;
        this.resultado = null;
        this.racha = 0;
        this.ultimoCristal = -99;
        this.puzzleResuelto = false;
        this.enfriamientoPulso = 0;
        this.pulsoActivo = 0;
        this.anillo.visible = false;

        for (const c of this.cristales) {
        c.recogido = false;
        c.malla.visible = modo === 'cristales';
        }
        for (const pl of this.placas) {
        pl.activa = false;
        pl.material.emissive.setHex(0x0b2a3a);
        pl.material.emissiveIntensity = 1;
        }
        this.placasActivas = 0;

        this.reponerObjetos();
        this.sonido.inicio();
        this.ui.mostrarAviso(
        modo === 'cristales'
            ? `Recoge los ${this.total} cristales antes de que se acabe el tiempo`
            : 'Modo libre: explora, agarra cajas, patea la pelota y marca goles',
        3800
        );
        this.ui.actualizarHUD(this.datosHUD());
    }

    // Devuelve cajas, barriles y pelota a su sitio inicial
    reponerObjetos() {
        this.agarrado = null;
        for (const d of this.fisica.dinamicos) {
        const b = d.cuerpo;
        b.collisionResponse = true;
        b.position.copy(d.posInicial);
        b.quaternion.copy(d.rotInicial);
        b.velocity.set(0, 0, 0);
        b.angularVelocity.set(0, 0, 0);
        }
    }

    reponerPelota() {
        if (!this.pelota) return;
        const cuerpo = this.pelota.cuerpo;
        cuerpo.position.set(POSICION_PELOTA.x, POSICION_PELOTA.y, POSICION_PELOTA.z);
        cuerpo.velocity.set(0, 0, 0);
        cuerpo.angularVelocity.set(0, 0, 0);
        cuerpo.quaternion.set(0, 0, 0, 1);
    }

    /* ---------- Acciones del jugador ---------- */

    agarrarOSoltar() {
        if (!this.control) return;
        if (this.agarrado) {
        this.soltar();
        return;
        }
        const p = this.cuerpoPersonaje.position;
        let mejor = null;
        let mejorDistancia = 2.3;
        for (const d of this.fisica.dinamicos) {
        if (d.cuerpo.mass > 20) continue;
        const distancia = Math.hypot(d.cuerpo.position.x - p.x, d.cuerpo.position.z - p.z);
        if (distancia < mejorDistancia) {
            mejor = d;
            mejorDistancia = distancia;
        }
        }
        if (!mejor) {
        this.ui.mostrarAviso('No hay nada para agarrar cerca', 1200);
        return;
        }
        this.agarrado = mejor;
        mejor.cuerpo.collisionResponse = false;
        this.sonido.agarrar();
        this.ui.mostrarAviso('Objeto agarrado. Vuelve a pulsar para soltarlo', 1600);
    }

    soltar() {
        if (!this.agarrado) return;
        const b = this.agarrado.cuerpo;
        const m = this.control ? this.control.mirada : 0;
        b.collisionResponse = true;
        b.velocity.set(Math.sin(m) * 1.5, 0.5, Math.cos(m) * 1.5);
        this.agarrado = null;
        this.sonido.soltar();
    }

    patear() {
        if (!this.control || this.tiempoPatada > 0) return;
        this.tiempoPatada = 0.45;
        const m = this.control.mirada;
        const fx = Math.sin(m);
        const fz = Math.cos(m);
        this.sonido.patada();

        // Si lleva algo en las manos, lo lanza
        if (this.agarrado) {
        const b = this.agarrado.cuerpo;
        b.collisionResponse = true;
        b.velocity.set(fx * 10, 3.5, fz * 10);
        this.agarrado = null;
        return;
        }

        const p = this.cuerpoPersonaje.position;
        for (const d of this.fisica.dinamicos) {
        const b = d.cuerpo;
        const dx = b.position.x - p.x;
        const dz = b.position.z - p.z;
        const distancia = Math.hypot(dx, dz);
        if (distancia > 2.4 || distancia < 0.01) continue;
        if ((dx * fx + dz * fz) / distancia < 0.5) continue; // solo lo que tiene delante
        const ligero = b.mass < 2;
        const velocidad = ligero ? 15 : 4.5;
        b.velocity.set(fx * velocidad, ligero ? 4 : 1.5, fz * velocidad);
        }
    }

    pulsoDeLuz() {
        if (!this.control) return;
        if (this.enfriamientoPulso > 0) {
        this.ui.mostrarAviso(`Pulso de luz listo en ${Math.ceil(this.enfriamientoPulso)} s`, 1000);
        return;
        }
        this.enfriamientoPulso = ENFRIAMIENTO_PULSO;
        this.pulsoActivo = DURACION_PULSO;
        this.sonido.pulso();
    }

    /* ---------- Bucle ---------- */

    // Se llama antes de avanzar la física
    preFisica() {
        const g = this.guardian;
        if (g) {
        const x = g.cuerpo.position.x;
        if (x > 1.5) g.direccion = -1;
        else if (x < -1.5) g.direccion = 1;
        g.cuerpo.velocity.set(g.direccion * 1.8, 0, 0);
        }
        if (this.agarrado && this.control) {
        const p = this.cuerpoPersonaje.position;
        const m = this.control.mirada;
        const b = this.agarrado.cuerpo;
        b.position.set(p.x + Math.sin(m) * 1.35, 1.1, p.z + Math.cos(m) * 1.35);
        b.velocity.set(0, 0, 0);
        b.angularVelocity.set(0, 0, 0);
        b.quaternion.setFromEuler(0, m, 0);
        }
    }

    // Animaciones visuales que siguen aunque el juego esté en pausa
    animar(t) {
        for (const c of this.cristales) {
        if (!c.malla.visible) continue;
        c.malla.rotation.y = t * 1.5 + c.fase;
        c.malla.position.y = 1.1 + Math.sin(t * 2 + c.fase) * 0.15;
        }
        if (this.guardian) this.guardian.grupo.position.x = this.guardian.cuerpo.position.x;
    }

    actualizarPulso(delta) {
        if (this.enfriamientoPulso > 0) this.enfriamientoPulso = Math.max(0, this.enfriamientoPulso - delta);
        if (this.pulsoActivo <= 0) {
        this.anillo.visible = false;
        return;
        }
        this.pulsoActivo -= delta;
        const p = this.cuerpoPersonaje.position;
        const k = 1 - Math.max(0, this.pulsoActivo) / DURACION_PULSO;
        this.anillo.visible = true;
        this.anillo.position.set(p.x, 0.12, p.z);
        this.anillo.scale.setScalar(0.5 + k * RADIO_PULSO);
        this.anillo.material.opacity = 0.8 * (1 - k);

        if (this.modo !== 'cristales') return;
        for (const c of this.cristales) {
        if (c.recogido) continue;
        const m = c.malla.position;
        const dx = p.x - m.x;
        const dz = p.z - m.z;
        const distancia = Math.hypot(dx, dz);
        if (distancia < RADIO_PULSO && distancia > 0.01) {
            const paso = Math.min(distancia, 8 * delta);
            m.x += (dx / distancia) * paso;
            m.z += (dz / distancia) * paso;
        }
        }
    }

    revisarCristales(t) {
        const p = this.cuerpoPersonaje.position;
        for (const c of this.cristales) {
        if (c.recogido) continue;
        const m = c.malla.position;
        if (Math.hypot(p.x - m.x, p.y - m.y, p.z - m.z) < RADIO_RECOGER) {
            c.recogido = true;
            c.malla.visible = false;
            this.recogidos++;

            this.racha = t - this.ultimoCristal < VENTANA_COMBO ? this.racha + 1 : 1;
            this.ultimoCristal = t;
            const multiplicador = Math.min(this.racha, 3);
            this.puntos += PUNTOS_CRISTAL * multiplicador;

            this.sonido.cristal(multiplicador);
            this.ui.mostrarAviso(
            multiplicador > 1
                ? `Cristal ${this.recogidos} de ${this.total}. Combo x${multiplicador}`
                : `Cristal ${this.recogidos} de ${this.total}`,
            1300
            );
        }
        }
    }

    revisarGol() {
        if (!this.pelota || this.agarrado === this.pelota) return;
        const p = this.pelota.cuerpo.position;
        const dentro = Math.abs(p.x) < 2.0 && p.y < 2.4 && p.z < this.zPorteria + 0.8 && p.z > this.zPorteria - 1.6;
        if (!dentro) return;
        this.goles++;
        this.puntos += PUNTOS_GOL;
        this.sonido.gol();
        this.ui.mostrarAviso('¡Gol!', 1800);
        this.reponerPelota();
    }

    revisarPlacas() {
        if (this.placas.length === 0) return;
        let activas = 0;
        for (const pl of this.placas) {
        const encima = this.fisica.dinamicos.some(
            (d) =>
            d !== this.pelota &&
            d !== this.agarrado &&
            Math.hypot(d.cuerpo.position.x - pl.x, d.cuerpo.position.z - pl.z) < 0.85 &&
            d.cuerpo.position.y < 1.2
        );
        if (encima !== pl.activa) {
            pl.activa = encima;
            pl.material.emissive.setHex(encima ? 0x2bff88 : 0x0b2a3a);
            pl.material.emissiveIntensity = encima ? 1.6 : 1;
            if (encima) this.sonido.placa();
        }
        if (pl.activa) activas++;
        }
        this.placasActivas = activas;

        if (!this.puzzleResuelto && activas === this.placas.length) {
        this.puzzleResuelto = true;
        this.puntos += PUNTOS_PUZZLE;
        if (this.modo === 'cristales') this.tiempo += SEGUNDOS_PUZZLE;
        this.sonido.puzzle();
        this.ui.mostrarAviso(
            this.modo === 'cristales'
            ? `¡Puzzle resuelto! +${PUNTOS_PUZZLE} puntos y +${SEGUNDOS_PUZZLE} segundos`
            : `¡Puzzle resuelto! +${PUNTOS_PUZZLE} puntos`,
            3000
        );
        }
    }

    actualizar(delta, t) {
        this.animar(t);
        if (this.tiempoPatada > 0) this.tiempoPatada -= delta;
        this.actualizarPulso(delta);
        this.revisarGol();
        this.revisarPlacas();

        if (this.modo === 'cristales') {
        this.tiempo = Math.max(0, this.tiempo - delta);
        this.revisarCristales(t);
        if (this.recogidos >= this.total) this.terminar(true);
        else if (this.tiempo <= 0) this.terminar(false);
        }

        this.sonido.musica.setTension(this.modo === 'cristales' && this.tiempo < 30);
        this.ui.actualizarHUD(this.datosHUD());
        this.ui.dibujarRadar(this.datosRadar());
    }

    terminar(completado) {
        this.modo = 'fin';
        this.sonido.musica.setTension(false);
        const bono = completado ? Math.ceil(this.tiempo) * BONO_POR_SEGUNDO : 0;
        this.puntos += bono;
        const estrellas = this.puntos >= 2200 ? 3 : this.puntos >= 1400 ? 2 : this.puntos >= 600 ? 1 : 0;

        const esRecord = this.puntos > this.record;
        if (esRecord) {
        this.record = this.puntos;
        this.guardarRecord(this.record);
        this.ui.setRecord(this.record);
        }

        this.resultado = {
        completado,
        estrellas,
        puntos: this.puntos,
        bono,
        recogidos: this.recogidos,
        total: this.total,
        goles: this.goles,
        puzzle: this.puzzleResuelto,
        record: this.record,
        esRecord,
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
        goles: this.goles,
        pulso: this.enfriamientoPulso > 0 ? `${Math.ceil(this.enfriamientoPulso)} s` : 'Listo'
        };
    }

    datosRadar() {
        const p = this.cuerpoPersonaje.position;
        return {
        jugador: { x: p.x, z: p.z, mirada: this.control ? this.control.mirada : 0 },
        cristales:
            this.modo === 'cristales'
            ? this.cristales.filter((c) => !c.recogido).map((c) => ({ x: c.malla.position.x, z: c.malla.position.z }))
            : [],
        placas: this.placas.map((pl) => ({ x: pl.x, z: pl.z, activa: pl.activa })),
        porteria: { x: 0, z: this.zPorteria },
        limite: this.limite
        };
    }
    }