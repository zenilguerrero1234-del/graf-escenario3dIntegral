    import * as THREE from 'three';
    import * as CANNON from 'cannon-es';
    import { agregarEstatico, agregarDinamico } from '../physics/physicalObjects.js';

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

    function conSombras(objeto) {
    objeto.traverse((hijo) => {
        if (hijo.isMesh) {
        hijo.castShadow = true;
        hijo.receiveShadow = true;
        }
    });
    return objeto;
    }

    const materiales = {
    tronco: new THREE.MeshStandardMaterial({ color: 0x5b3d26, roughness: 0.95 }),
    hojas: new THREE.MeshStandardMaterial({ color: 0x2f5d3a, roughness: 0.9, flatShading: true }),
    roca: new THREE.MeshStandardMaterial({ color: 0x7d817c, roughness: 1, flatShading: true }),
    madera: new THREE.MeshStandardMaterial({ color: 0x9a6b3f, roughness: 0.85 }),
    barril: new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.8 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x3b4a52, roughness: 0.5, metalness: 0.6 }),
    pelota: new THREE.MeshStandardMaterial({ color: 0xd9453d, roughness: 0.45 }),
    muro: new THREE.MeshStandardMaterial({ color: 0x8b8f8a, roughness: 1 }),
    foco: new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffc870, emissiveIntensity: 2 })
    };

    export function crearObjetos(scene, fisica, limite) {
    const aleatorio = crearAleatorio(20260317);
    const ocupados = [];
    const ocupar = (x, z, r) => ocupados.push({ x, z, r });
    const libre = (x, z, r) => {
        if (Math.hypot(x, z) < 5 + r) return false;
        return ocupados.every((o) => Math.hypot(o.x - x, o.z - z) > o.r + r + 0.8);
    };

    // Muro de piedra visible. Su colisión está en collisions.js
    const largoMuro = (limite + 1) * 2;
    const posicionesMuro = [
        { medidas: [largoMuro, 1.4, 1], pos: [0, 0.7, -(limite + 0.5)] },
        { medidas: [largoMuro, 1.4, 1], pos: [0, 0.7, limite + 0.5] },
        { medidas: [1, 1.4, largoMuro], pos: [-(limite + 0.5), 0.7, 0] },
        { medidas: [1, 1.4, largoMuro], pos: [limite + 0.5, 0.7, 0] }
    ];
    for (const m of posicionesMuro) {
        const malla = new THREE.Mesh(new THREE.BoxGeometry(...m.medidas), materiales.muro);
        malla.position.set(...m.pos);
        scene.add(conSombras(malla));
    }

    // Cajas de madera (dinámicas): una pila de tres más una encima, y dos sueltas
    const posCajas = [
        [6, 0.5, -4], [7.05, 0.5, -4], [8.1, 0.5, -4], [7.05, 1.55, -4],
        [-5, 0.5, -6], [-6.2, 0.5, -8]
    ];
    for (const [x, y, z] of posCajas) {
        const caja = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materiales.madera);
        caja.position.set(x, y, z);
        scene.add(conSombras(caja));
        agregarDinamico(fisica, caja, new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)), { masa: 8 });
        ocupar(x, z, 0.8);
    }

    // Barriles (dinámicos). La colisión es una caja que los aproxima
    const posBarriles = [[-9, -3], [-10.1, -3.4], [3, 8], [4.2, 8.6]];
    for (const [x, z] of posBarriles) {
        const barril = new THREE.Group();
        const cuerpoVisual = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 20), materiales.barril);
        barril.add(cuerpoVisual);
        for (const y of [-0.35, 0.35]) {
        const aro = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.08, 20), materiales.metal);
        aro.position.y = y;
        barril.add(aro);
        }
        barril.position.set(x, 0.56, z);
        scene.add(conSombras(barril));
        agregarDinamico(fisica, barril, new CANNON.Box(new CANNON.Vec3(0.42, 0.55, 0.42)), { masa: 12 });
        ocupar(x, z, 0.7);
    }

    // Pelota (dinámica)
    const pelota = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 16), materiales.pelota);
    pelota.position.set(2, 0.36, 4);
    scene.add(conSombras(pelota));
    agregarDinamico(fisica, pelota, new CANNON.Sphere(0.35), {
        masa: 0.6,
        material: fisica.materiales.pelota,
        amortiguacion: 0.2,
        amortiguacionAngular: 0.2
    });
    ocupar(2, 4, 0.6);

    // Tronco caído (estático)
    const giroTronco = 0.6;
    const tronco = new THREE.Group();
    const cilindro = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 4, 14), materiales.tronco);
    cilindro.rotation.z = Math.PI / 2;
    tronco.add(cilindro);
    tronco.position.set(-8, 0.4, 6);
    tronco.rotation.y = giroTronco;
    scene.add(conSombras(tronco));
    agregarEstatico(fisica, new CANNON.Box(new CANNON.Vec3(2, 0.4, 0.4)), -8, 0.4, 6, giroTronco);
    ocupar(-8, 6, 2.2);

    // Farolas (estáticas) con luz puntual
    const posFarolas = [[-12, -12], [12, -12], [-12, 12], [12, 12]];
    for (const [x, z] of posFarolas) {
        const farola = new THREE.Group();
        const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 3.2, 10), materiales.metal);
        poste.position.y = 1.6;
        const foco = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), materiales.foco);
        foco.position.y = 3.3;
        farola.add(poste, foco);
        farola.position.set(x, 0, z);
        scene.add(conSombras(farola));
        const luz = new THREE.PointLight(0xffc880, 30, 14, 2);
        luz.position.set(x, 3.2, z);
        scene.add(luz);
        agregarEstatico(fisica, new CANNON.Box(new CANNON.Vec3(0.15, 1.6, 0.15)), x, 1.6, z);
        ocupar(x, z, 0.5);
    }

    // Pinos (estáticos), repartidos con una semilla fija
    let pinos = 0;
    let intentos = 0;
    while (pinos < 16 && intentos < 400) {
        intentos++;
        const x = (aleatorio() * 2 - 1) * (limite - 3);
        const z = (aleatorio() * 2 - 1) * (limite - 3);
        const escala = 0.8 + aleatorio() * 0.6;
        if (!libre(x, z, 1.2 * escala)) continue;

        const pino = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.4, 10), materiales.tronco);
        base.position.y = 0.7;
        pino.add(base);
        const capas = [
        { r: 1.3, h: 2.2, y: 2.1 },
        { r: 1.0, h: 2.0, y: 3.3 },
        { r: 0.7, h: 1.8, y: 4.4 }
        ];
        for (const c of capas) {
        const cono = new THREE.Mesh(new THREE.ConeGeometry(c.r, c.h, 9), materiales.hojas);
        cono.position.y = c.y;
        pino.add(cono);
        }
        pino.position.set(x, 0, z);
        pino.scale.setScalar(escala);
        pino.rotation.y = aleatorio() * Math.PI * 2;
        scene.add(conSombras(pino));
        agregarEstatico(fisica, new CANNON.Box(new CANNON.Vec3(0.3 * escala, 2 * escala, 0.3 * escala)), x, 2 * escala, z);
        ocupar(x, z, 1.2 * escala);
        pinos++;
    }

    // Rocas (estáticas)
    let rocas = 0;
    intentos = 0;
    while (rocas < 8 && intentos < 400) {
        intentos++;
        const x = (aleatorio() * 2 - 1) * (limite - 2);
        const z = (aleatorio() * 2 - 1) * (limite - 2);
        const r = 0.6 + aleatorio() * 0.8;
        if (!libre(x, z, r)) continue;

        const roca = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), materiales.roca);
        roca.scale.set(1.1, 0.75, 0.9);
        roca.position.set(x, r * 0.6, z);
        roca.rotation.y = aleatorio() * Math.PI * 2;
        scene.add(conSombras(roca));
        agregarEstatico(fisica, new CANNON.Sphere(r * 0.85), x, r * 0.6, z);
        ocupar(x, z, r);
        rocas++;
    }
    }