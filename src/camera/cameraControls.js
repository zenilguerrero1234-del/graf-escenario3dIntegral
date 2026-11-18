    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

    export function crearControlesCamara(camera, elementoDom) {
    const controls = new OrbitControls(camera, elementoDom);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 14;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.target.set(0, 1.2, 0);

    const objetivo = new THREE.Vector3();
    const anterior = new THREE.Vector3();
    const desplazamiento = new THREE.Vector3();

    // Mueve el punto de mira hacia el personaje y arrastra la cámara con él,
    // así el ángulo que eligió el usuario se conserva mientras se desplaza
    function seguir(posicion, delta) {
        objetivo.set(posicion.x, posicion.y + 1.2, posicion.z);
        anterior.copy(controls.target);
        controls.target.lerp(objetivo, 1 - Math.exp(-8 * delta));
        desplazamiento.copy(controls.target).sub(anterior);
        camera.position.add(desplazamiento);
        controls.update();
    }

    return { controls, seguir };
    }