# Brumaluz: Cazadores de Cristales

Juego 3D hecho con Three.js, cannon-es y Vite. Se controla a un personaje humano modelado en 3D por un claro de bosque con niebla, y se puede jugar en el navegador o con unas gafas Meta Quest 3S.

Página publicada: https://zenilguerrero1234-del.github.io/graf-escenario3dIntegral/

Integrantes:

- Juan Pablo Sánchez García (24200101)
- Eduardo Zenil Guerrero (25200365)

## Qué incluye

- Menú principal con dos modos de juego, ayuda, controles, créditos, música y efectos.
- Personaje humano en FBX (Mixamo) con animaciones de reposo, caminar, correr, bailar y saltar. Se voltea hacia la dirección en la que se mueve.
- Escenario con piso texturizado, ambiente HDR de 360 grados, niebla gris clara, sombras, farolas y luciérnagas.
- Más de cinco tipos de objetos: pinos, rocas, tronco caído, cajas, barriles, farolas y una pelota.
- Físicas y colisiones con cannon-es. El personaje no atraviesa los obstáculos ni sale del claro.
- Cámara con OrbitControls que sigue al personaje sin quitarte el control del ratón.
- Música de fondo generada por código y efectos de sonido.
- Soporte para Meta Quest 3S mediante WebXR.

## Cómo se juega

Hay dos modos:

- Cazar cristales: tienes 150 segundos para recoger los 12 cristales de luz que flotan por el claro. Cada cristal vale 100 puntos y, si encadenas varios con menos de 4 segundos entre uno y otro, el combo multiplica los puntos hasta por tres. Al final hay un bono por el tiempo que sobre y de una a tres estrellas. El récord se guarda en el navegador.
- Modo libre: sin tiempo ni cristales, para explorar y probar todo.

Mecánicas:

- Pulso de luz: atrae los cristales cercanos. Se recarga en 8 segundos.
- Agarrar: sujeta una caja, un barril o la pelota, y puedes soltarlos o lanzarlos.
- Placas de luz: hay tres placas en el suelo. Si pones un objeto sobre cada una ganas 400 puntos y 20 segundos extra.
- Portería: patea la pelota hacia la portería verde. Un guardián de piedra se mueve de lado a lado para detenerla. Cada gol vale 150 puntos.
- Radar: en una esquina muestra los cristales, las placas y la portería.

## Controles de teclado

| Tecla | Acción |
|---|---|
| ↑ | Avanzar |
| ↓ | Retroceder |
| ← | Desplazarse a la izquierda |
| → | Desplazarse a la derecha |
| 1 | Animación de caminar |
| 2 | Animación de correr |
| 3 | Animación de bailar |
| Espacio | Saltar |
| E | Girar 90 grados |
| P | Iniciar o detener el movimiento |
| F | Agarrar o soltar un objeto |
| Q | Patear o lanzar |
| R | Pulso de luz |
| M | Abrir el menú y pausar |

La cámara se gira arrastrando con el botón izquierdo del ratón y se acerca o aleja con la rueda.

## Controles de Meta Quest 3S

| Mando | Acción |
|---|---|
| Joystick izquierdo | Mover al personaje |
| Joystick derecho | Girar la vista en pasos de 45 grados |
| Presionar un joystick | Iniciar o detener el movimiento |
| Botón A (mando derecho) | Saltar |
| Botón B (mando derecho) | Bailar o dejar de bailar |
| Botón X (mando izquierdo) | Cambiar entre caminar y correr |
| Botón Y (mando izquierdo) | Mostrar u ocultar el panel de ayuda |
| Gatillo derecho | Patear o lanzar |
| Gatillo izquierdo | Pulso de luz |
| Botón de agarre | Agarrar o soltar objetos |
| Botón Meta | Abre el menú del visor (lo controla Meta) |

Cuando termina una partida, el gatillo o el botón A empiezan otra.

## Usarlo con las gafas

1. Abre la página publicada con el navegador de las Meta Quest. WebXR solo funciona con HTTPS, y GitHub Pages ya lo ofrece.
2. En el menú, pulsa "Entrar en VR". Si el botón aparece desactivado, el mensaje que está debajo explica el motivo.
3. Dentro de las gafas el juego empieza en modo cristales. La vista es en tercera persona, detrás del personaje, y el marcador y el panel de ayuda flotan frente a ti.
4. Para salir, usa el botón Meta.

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

El personaje y todas las animaciones se descargan de Mixamo con el mismo personaje seleccionado, para que compartan esqueleto. El HDR es el "Whipple Creek Regional Park 01" de Poly Haven. Las texturas del piso y la música se generaron por código.

## Estructura del proyecto

```
graf-escenario3dIntegral/
├── .github/workflows/deploy.yml
├── public/
├── src/
│   ├── main.js
│   ├── config.js
│   ├── style.css
│   ├── audio/        música de fondo y efectos generados por código
│   ├── camera/       cámara con OrbitControls
│   ├── character/    carga, animaciones y controles del personaje
│   ├── game/         cristales, placas, portería, guardián, puntos y récord
│   ├── input/        teclado
│   ├── objects/      pinos, rocas, cajas, barriles, farolas y pelota
│   ├── physics/      mundo físico y colisiones
│   ├── scene/        escena, iluminación, ambiente, piso y luciérnagas
│   ├── ui/           menú, marcador, radar y avisos
│   └── vr/           sesión WebXR, mandos y paneles dentro de las gafas
├── index.html
├── package.json
└── vite.config.js
```

## Tecnologías

HTML, CSS y JavaScript con módulos. Three.js para el render, la carga de modelos y WebXR. cannon-es para las físicas. Web Audio para la música y los efectos. Vite para el desarrollo y la compilación.

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
- Piso y música: generados por código.
- Librerías: Three.js, cannon-es y Vite.