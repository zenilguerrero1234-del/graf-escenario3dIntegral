# El Claro Brumoso

Escenario 3D interactivo hecho con Three.js, cannon-es y Vite. Es el proyecto final de la materia de Graficación. Se controla a un personaje humano modelado en 3D por un claro de bosque con niebla, y se puede jugar en el navegador o con unas gafas Meta Quest 3S.

Página publicada: https://zenilguerrero1234-del.github.io/graf-escenario3dIntegral/

Integrantes:

- Juan Pablo Sánchez García (24200101)
- Eduardo Zenil Guerrero (25200365)

## Qué incluye

- Menú principal con dos modos de juego, controles, créditos y opción de sonido.
- Personaje humano en FBX (Mixamo) con animaciones de reposo, caminar, correr, bailar y saltar, con transiciones suaves entre ellas.
- Escenario con piso texturizado, ambiente HDR de 360 grados, niebla gris clara, sombras, farolas y luciérnagas.
- Más de cinco tipos de objetos: pinos, rocas, tronco caído, cajas, barriles, farolas y una pelota.
- Físicas y colisiones con cannon-es. Las cajas, los barriles y la pelota se pueden empujar, y el personaje no atraviesa los obstáculos ni sale del claro.
- Cámara con OrbitControls que sigue al personaje sin quitarte el control del ratón.
- Soporte para Meta Quest 3S mediante WebXR.

## Cómo se juega

Hay dos modos:

- Cristales de luz: tienes 150 segundos para recoger los 12 cristales que flotan por el claro. Cada cristal vale 100 puntos y cada gol 150. Si los recoges todos, ganas un bono por el tiempo que sobre. Al final se muestran los puntos y de una a tres estrellas.
- Modo libre: sin tiempo ni cristales. Sirve para explorar, probar las animaciones y jugar con la pelota.

En los dos modos puedes meter la pelota en la portería, que está en el extremo opuesto al inicio.

## Controles de teclado

| Tecla | Acción |
|---|---|
| W | Avanzar |
| S | Retroceder |
| A | Desplazarse a la izquierda |
| D | Desplazarse a la derecha |
| 1 | Animación de caminar |
| 2 | Animación de correr |
| 3 | Animación de bailar |
| Espacio | Saltar |
| E | Girar 90 grados |
| P | Iniciar o detener el movimiento |
| M | Abrir el menú y pausar |

La cámara se gira arrastrando con el botón izquierdo del ratón y se acerca o aleja con la rueda.

## Controles de Meta Quest 3S

| Mando | Acción |
|---|---|
| Palanca izquierda | Mover al personaje |
| Palanca derecha | Girar la vista en pasos de 45 grados |
| Botón A | Saltar |
| Botón B | Bailar o dejar de bailar |
| Botón X | Cambiar entre caminar y correr |
| Botón Y | Mostrar u ocultar el panel de ayuda |
| Gatillo derecho | Iniciar o detener el movimiento |
| Gatillo izquierdo | Reiniciar la partida |

## Usarlo con las gafas

1. Abre la página publicada con el navegador de las Meta Quest. WebXR solo funciona con HTTPS, y GitHub Pages ya lo ofrece.
2. En el menú, pulsa "Entrar en VR". Si el botón aparece desactivado, el mensaje que está debajo explica el motivo.
3. Dentro de las gafas el juego empieza en modo cristales. La vista es en tercera persona, detrás del personaje, y el marcador y el panel de ayuda flotan frente a ti.
4. Para salir, usa el botón de menú de Meta.

La vista se mueve junto con el personaje, y a algunas personas eso les puede dar mareo. Si pasa, se pueden bajar las velocidades en `src/config.js` o aumentar `DISTANCIA_ATRAS` en `src/vr/vrManager.js`.

## Ejecutar en local

Hace falta Node.js 20 o superior y Git.

```
npm install
npm run dev
```

Abre la dirección que muestre la terminal, con la ruta incluida:

```
http://localhost:5173/graf-escenario3dIntegral/
```

Para generar la versión de publicación:

```
npm run build
npm run preview
```

## Recursos necesarios

Los archivos pesados van en `public/assets/` y deben tener exactamente estos nombres:

```
public/assets/
├── models/character.fbx
├── animations/idle.fbx
├── animations/walk.fbx
├── animations/run.fbx
├── animations/dance.fbx
├── animations/jump.fbx
├── textures/floor_color.png
├── textures/floor_normal.png
├── textures/floor_roughness.png
└── hdr/forest.hdr
```

El personaje y todas las animaciones se descargan de Mixamo con el mismo personaje seleccionado, para que compartan esqueleto. El HDR es el "Whipple Creek Regional Park 01" de Poly Haven. Las texturas del piso se generaron por código.

## Estructura del proyecto

```
graf-escenario3dIntegral/
├── .github/workflows/deploy.yml
├── public/
├── src/
│   ├── main.js
│   ├── config.js
│   ├── style.css
│   ├── audio/        sonidos generados por código
│   ├── camera/       cámara con OrbitControls
│   ├── character/    carga, animaciones y controles del personaje
│   ├── game/         cristales, portería, puntos y tiempo
│   ├── input/        teclado
│   ├── objects/      pinos, rocas, cajas, barriles, farolas y pelota
│   ├── physics/      mundo físico y colisiones
│   ├── scene/        escena, iluminación, ambiente, piso y luciérnagas
│   ├── ui/           menú, marcador y avisos
│   └── vr/           sesión WebXR, mandos y paneles dentro de las gafas
├── index.html
├── package.json
└── vite.config.js
```

## Tecnologías

HTML, CSS y JavaScript con módulos. Three.js para el render, la carga de modelos y WebXR. cannon-es para las físicas. Vite para el desarrollo y la compilación.

## Publicación

Cada vez que se sube algo a la rama `main`, un flujo de GitHub Actions compila el proyecto con Vite y publica la carpeta `dist` en GitHub Pages.

La ruta base de `vite.config.js` debe coincidir con el nombre del repositorio, incluyendo mayúsculas:

```js
base: '/graf-escenario3dIntegral/'
```

Para actualizar la página:

```
git add .
git commit -m "Describe el cambio"
git push
```

Después hay que esperar a que la pestaña Actions del repositorio muestre los dos pasos en verde y recargar la página con Ctrl + F5.

## Créditos y licencias

- Personaje y animaciones: Mixamo.
- Ambiente HDR: Poly Haven, licencia CC0.
- Piso: texturas generadas por código.
- Librerías: Three.js, cannon-es y Vite.