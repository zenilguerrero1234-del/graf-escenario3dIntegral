    import * as THREE from 'three';

    export function crearIluminacion(scene, limite) {
    const hemisferica = new THREE.HemisphereLight(0xdfe8e4, 0x3b4a3a, 0.9);
    scene.add(hemisferica);

    const sol = new THREE.DirectionalLight(0xfff1d6, 2.0);
    sol.position.set(-18, 28, 12);
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
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

    return { hemisferica, sol };
    }