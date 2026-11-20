    import * as THREE from 'three';

    export function crearIluminacion(scene, limite, opciones = {}) {
    const { sombras = 2048 } = opciones;

    const hemisferica = new THREE.HemisphereLight(0xe8f0ec, 0x4a5c48, 1.3);
    scene.add(hemisferica);

    const sol = new THREE.DirectionalLight(0xfff1d6, 2.2);
    sol.position.set(-18, 28, 12);
    sol.castShadow = true;
    sol.shadow.mapSize.set(sombras, sombras);
    const area = limite + 4;
    sol.shadow.camera.left = -area;
    sol.shadow.camera.right = area;
    sol.shadow.camera.top = area;
    sol.shadow.camera.bottom = -area;
    sol.shadow.camera.near = 1;
    sol.shadow.camera.far = 80;
    sol.shadow.bias = -0.0004;
    sol.shadow.normalBias = 0.03;
    scene.add(sol);

    // Luz de relleno desde el lado contrario al sol, sin sombras, para aclarar las partes oscuras
    const relleno = new THREE.DirectionalLight(0xdde8ff, 0.9);
    relleno.position.set(14, 10, -16);
    scene.add(relleno);

    return { hemisferica, sol, relleno };
    }