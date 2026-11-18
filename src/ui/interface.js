    const CONTROLES = [
    ['W', 'Avanzar'],
    ['S', 'Retroceder'],
    ['A', 'Desplazarse a la izquierda'],
    ['D', 'Desplazarse a la derecha'],
    ['1', 'Animación de caminar'],
    ['2', 'Animación de correr'],
    ['3', 'Animación de bailar'],
    ['Espacio', 'Saltar'],
    ['E', 'Girar 90 grados'],
    ['P', 'Iniciar o detener el movimiento']
    ];

    function llenarTabla(idCuerpo) {
    const cuerpo = document.getElementById(idCuerpo);
    if (!cuerpo) return;
    cuerpo.innerHTML = '';
    for (const [tecla, accion] of CONTROLES) {
        const fila = document.createElement('tr');
        const th = document.createElement('th');
        th.scope = 'row';
        const kbd = document.createElement('kbd');
        kbd.textContent = tecla;
        th.appendChild(kbd);
        const td = document.createElement('td');
        td.textContent = accion;
        fila.append(th, td);
        cuerpo.appendChild(fila);
    }
    }

    export function iniciarInterfaz() {
    llenarTabla('controles-hud');
    llenarTabla('controles-pie');

    const panel = document.getElementById('panel-ayuda');
    const boton = document.getElementById('boton-ayuda');
    boton.addEventListener('click', () => {
        const plegado = panel.classList.toggle('panel--plegado');
        boton.textContent = plegado ? 'Mostrar ayuda' : 'Ocultar ayuda';
        boton.setAttribute('aria-expanded', String(!plegado));
    });
    }

    export function actualizarEstado({ animacion, movimiento, rotacion }) {
    if (animacion !== undefined) {
        document.getElementById('estado-animacion').textContent = animacion;
    }
    if (movimiento !== undefined) {
        document.getElementById('estado-movimiento').textContent = movimiento ? 'En marcha' : 'Detenido';
    }
    if (rotacion !== undefined) {
        document.getElementById('estado-rotacion').textContent = `${((rotacion % 360) + 360) % 360}°`;
    }
    }

    export function actualizarProgreso(fraccion, texto) {
    const relleno = document.getElementById('carga-relleno');
    relleno.style.width = `${Math.round(Math.min(1, Math.max(0, fraccion)) * 100)}%`;
    if (texto) document.getElementById('carga-texto').textContent = texto;
    }

    export function ocultarCarga() {
    document.getElementById('carga').classList.add('carga--oculta');
    }

    export function mostrarError(mensaje) {
    const caja = document.getElementById('carga-error');
    caja.textContent = mensaje;
    caja.hidden = false;
    }