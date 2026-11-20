    import * as THREE from 'three';

    function crearTextura() {
    const lienzo = document.createElement('canvas');
    lienzo.width = 64;
    lienzo.height = 64;
    const ctx = lienzo.getContext('2d');
    const degradado = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    degradado.addColorStop(0, 'rgba(255, 240, 170, 1)');
    degradado.addColorStop(0.4, 'rgba(255, 220, 120, 0.5)');
    degradado.addColorStop(1, 'rgba(255, 220, 120, 0)');
    ctx.fillStyle = degradado;
    ctx.fillRect(0, 0, 64, 64);
    const textura = new THREE.CanvasTexture(lienzo);
    textura.colorSpace = THREE.SRGBColorSpace;
    return textura;
    }

    export function crearLuciernagas(scene, limite, cantidad = 140) {
    const posiciones = new Float32Array(cantidad * 3);
    const base = new Float32Array(cantidad * 3);
    const fase = new Float32Array(cantidad);

    for (let i = 0; i < cantidad; i++) {
        base[i * 3] = (Math.random() * 2 - 1) * (limite - 1);
        base[i * 3 + 1] = 0.6 + Math.random() * 2.9;
        base[i * 3 + 2] = (Math.random() * 2 - 1) * (limite - 1);
        fase[i] = Math.random() * Math.PI * 2;
    }
    posiciones.set(base);

    const geometria = new THREE.BufferGeometry();
    const atributo = new THREE.BufferAttribute(posiciones, 3);
    geometria.setAttribute('position', atributo);

    const material = new THREE.PointsMaterial({
        map: crearTextura(),
        color: 0xffe9a0,
        size: 0.35,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const puntos = new THREE.Points(geometria, material);
    puntos.frustumCulled = false;
    scene.add(puntos);

    return {
        actualizar(t) {
        for (let i = 0; i < cantidad; i++) {
            const f = fase[i];
            posiciones[i * 3] = base[i * 3] + Math.sin(t * 0.5 + f) * 0.6;
            posiciones[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.9 + f * 2) * 0.35;
            posiciones[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.45 + f) * 0.6;
        }
        atributo.needsUpdate = true;
        }
    };
    }