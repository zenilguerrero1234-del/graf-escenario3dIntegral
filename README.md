# El Claro Brumoso

Escenario 3D interactivo hecho con Three.js, cannon-es y Vite. Proyecto final de Graficación.

Integrantes: Juan Pablo Sánchez García (24200101) y Eduardo Zenil Guerrero (25200365).

## Ejecutar en local

    npm install
    npm run dev

Abre la dirección que muestre la terminal (normalmente http://localhost:5173/graf-escenario3dIntegral/).

## Controles

W, S, A, D mueven al personaje. 1 camina, 2 corre, 3 baila. Espacio salta. E gira 90 grados. P inicia o detiene el movimiento. El ratón gira y acerca la cámara.

## Recursos

Personaje y animaciones: Mixamo. HDR y texturas: Poly Haven y ambientCG (CC0). Los archivos van en public/assets/.

## Publicación

Cada push a main compila con Vite y publica la carpeta dist en GitHub Pages mediante GitHub Actions.