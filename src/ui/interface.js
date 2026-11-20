    export const CONTROLES = [
    ['W', 'Avanzar'],
    ['S', 'Retroceder'],
    ['A', 'Desplazarse a la izquierda'],
    ['D', 'Desplazarse a la derecha'],
    ['1', 'Animación de caminar'],
    ['2', 'Animación de correr'],
    ['3', 'Animación de bailar'],
    ['Espacio', 'Saltar'],
    ['E', 'Girar 90 grados'],
    ['P', 'Iniciar o detener el movimiento'],
    ['M', 'Abrir el menú y pausar']
    ];

    export const CONTROLES_VR = [
    ['Palanca izquierda', 'Mover al personaje'],
    ['Palanca derecha', 'Girar la vista (pasos de 45°)'],
    ['Botón A', 'Saltar'],
    ['Botón B', 'Bailar o dejar de bailar'],
    ['Botón X', 'Cambiar entre caminar y correr'],
    ['Botón Y', 'Mostrar u ocultar este panel'],
    ['Gatillo derecho', 'Iniciar o detener el movimiento'],
    ['Gatillo izquierdo', 'Reiniciar la partida']
    ];

    const $ = (id) => document.getElementById(id);
    const cache = {};
    let temporizadorAviso = null;
    let irAVistaPrincipal = () => {};

    function poner(id, valor) {
    if (cache[id] === valor) return;
    cache[id] = valor;
    $(id).textContent = valor;
    }

    function llenarTabla(idCuerpo, lista) {
    const cuerpo = $(idCuerpo);
    if (!cuerpo) return;
    cuerpo.innerHTML = '';
    for (const [tecla, accion] of lista) {
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

    function formatoTiempo(segundos) {
    const s = Math.ceil(segundos);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }

    export function iniciarInterfaz(acciones) {
    llenarTabla('controles-menu', CONTROLES);
    llenarTabla('controles-vr', CONTROLES_VR);

    const vistas = ['vista-principal', 'vista-controles', 'vista-creditos'];
    const mostrarVista = (id) => {
        for (const v of vistas) $(v).hidden = v !== id;
    };
    irAVistaPrincipal = () => mostrarVista('vista-principal');

    $('btn-controles').addEventListener('click', () => mostrarVista('vista-controles'));
    $('btn-creditos').addEventListener('click', () => mostrarVista('vista-creditos'));
    document.querySelectorAll('[data-volver]').forEach((b) => b.addEventListener('click', irAVistaPrincipal));

    $('btn-jugar').addEventListener('click', () => acciones.alJugar());
    $('btn-libre').addEventListener('click', () => acciones.alLibre());
    $('btn-continuar').addEventListener('click', () => acciones.alContinuar());
    $('btn-vr').addEventListener('click', () => acciones.alVR());
    $('btn-sonido').addEventListener('click', () => {
        const silenciado = acciones.alSonido();
        $('btn-sonido').textContent = silenciado ? 'Sonido: no' : 'Sonido: sí';
    });
    $('boton-menu').addEventListener('click', () => acciones.alAbrirMenu());
    $('btn-reintentar').addEventListener('click', () => acciones.alReiniciar());
    $('btn-res-menu').addEventListener('click', () => acciones.alVolverMenu());
    }

    /* Menú */
    export function mostrarMenu({ puedeContinuar = false } = {}) {
    irAVistaPrincipal();
    $('btn-continuar').hidden = !puedeContinuar;
    $('menu').classList.remove('menu--oculto');
    }

    export function ocultarMenu() {
    $('menu').classList.add('menu--oculto');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }

    export function menuAbierto() {
    return !$('menu').classList.contains('menu--oculto');
    }

    export function resultadoAbierto() {
    return !$('resultado').hidden;
    }

    export function pantallaAbierta() {
    return menuAbierto() || resultadoAbierto();
    }

    export function setEstadoVR(disponible, mensaje) {
    $('btn-vr').disabled = !disponible;
    $('nota-vr').textContent = mensaje;
    }

    /* Marcador */
    export function mostrarHUD(visible) {
    $('hud-juego').hidden = !visible;
    }

    export function actualizarHUD({ modo, tiempo, recogidos, total, puntos, goles }) {
    $('hud-juego').dataset.modo = modo === 'libre' ? 'libre' : 'cristales';
    poner('hud-tiempo', formatoTiempo(tiempo));
    poner('hud-cristales', `${recogidos}/${total}`);
    poner('hud-puntos', String(puntos));
    poner('hud-goles', String(goles));
    }

    export function mostrarAviso(texto, ms = 2200) {
    const aviso = $('aviso');
    aviso.textContent = texto;
    aviso.hidden = false;
    aviso.style.animation = 'none';
    void aviso.offsetWidth;
    aviso.style.animation = '';
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => {
        aviso.hidden = true;
    }, ms);
    }

    /* Resultado */
    export function mostrarResultado(r) {
    $('res-titulo').textContent = r.completado ? '¡Todos los cristales!' : 'Se acabó el tiempo';
    $('res-estrellas').textContent = '★'.repeat(r.estrellas) + '☆'.repeat(3 - r.estrellas);
    $('res-puntos').textContent = String(r.puntos);
    const bono = r.bono > 0 ? ` Bono por tiempo: ${r.bono}.` : '';
    $('res-detalle').textContent = `Cristales: ${r.recogidos} de ${r.total}. Goles: ${r.goles}. Tiempo usado: ${r.tiempoUsado} s.${bono}`;
    $('resultado').hidden = false;
    }

    export function ocultarResultado() {
    $('resultado').hidden = true;
    }

    /* Estado del personaje y carga (se conservan igual) */
    export function actualizarEstado({ animacion, movimiento, rotacion }) {
    if (animacion !== undefined) {
        $('estado-animacion').textContent = animacion;
    }
    if (movimiento !== undefined) {
        $('estado-movimiento').textContent = movimiento ? 'En marcha' : 'Detenido';
    }
    if (rotacion !== undefined) {
        $('estado-rotacion').textContent = `${((rotacion % 360) + 360) % 360}°`;
    }
    }

    export function actualizarProgreso(fraccion, texto) {
    const relleno = $('carga-relleno');
    relleno.style.width = `${Math.round(Math.min(1, Math.max(0, fraccion)) * 100)}%`;
    if (texto) $('carga-texto').textContent = texto;
    }

    export function ocultarCarga() {
    $('carga').classList.add('carga--oculta');
    }

    export function mostrarError(mensaje) {
    const caja = $('carga-error');
    caja.textContent = mensaje;
    caja.hidden = false;
    }