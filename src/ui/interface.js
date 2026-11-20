    export const CONTROLES = [
    ['↑', 'Avanzar'],
    ['↓', 'Retroceder'],
    ['←', 'Desplazarse a la izquierda'],
    ['→', 'Desplazarse a la derecha'],
    ['1', 'Animación de caminar'],
    ['2', 'Animación de correr'],
    ['3', 'Animación de bailar'],
    ['Espacio', 'Saltar'],
    ['E', 'Girar 90 grados'],
    ['P', 'Iniciar o detener el movimiento'],
    ['F', 'Agarrar o soltar un objeto'],
    ['Q', 'Patear o lanzar'],
    ['R', 'Pulso de luz'],
    ['M', 'Pausar o reanudar el juego']
    ];

    export const CONTROLES_VR = [
    ['Joystick izquierdo', 'Mover al personaje'],
    ['Joystick derecho', 'Girar la vista (pasos de 45°)'],
    ['Presionar un joystick', 'Iniciar o detener el movimiento'],
    ['Botón A (derecho)', 'Saltar'],
    ['Botón B (derecho)', 'Bailar o dejar de bailar'],
    ['Botón X (izquierdo)', 'Cambiar entre caminar y correr'],
    ['Botón Y (izquierdo)', 'Mostrar u ocultar este panel'],
    ['Gatillo derecho', 'Patear o lanzar'],
    ['Gatillo izquierdo', 'Pulso de luz'],
    ['Botón de agarre', 'Agarrar o soltar objetos'],
    ['Botón Meta', 'Menú del visor (lo maneja Meta)']
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

    const vistas = ['vista-principal', 'vista-controles', 'vista-ayuda', 'vista-creditos'];
    const mostrarVista = (id) => {
        for (const v of vistas) $(v).hidden = v !== id;
    };
    irAVistaPrincipal = () => mostrarVista('vista-principal');

    $('btn-controles').addEventListener('click', () => mostrarVista('vista-controles'));
    $('btn-ayuda').addEventListener('click', () => mostrarVista('vista-ayuda'));
    $('btn-creditos').addEventListener('click', () => mostrarVista('vista-creditos'));
    document.querySelectorAll('[data-volver]').forEach((b) => b.addEventListener('click', irAVistaPrincipal));

    $('btn-jugar').addEventListener('click', () => acciones.alJugar());
    $('btn-libre').addEventListener('click', () => acciones.alLibre());
    $('btn-continuar').addEventListener('click', () => acciones.alContinuar());
    $('btn-vr').addEventListener('click', () => acciones.alVR());
    $('btn-musica').addEventListener('click', () => {
        const silenciada = acciones.alMusica();
        $('btn-musica').textContent = silenciada ? 'Música: no' : 'Música: sí';
    });
    $('btn-sonido').addEventListener('click', () => {
        const silenciado = acciones.alSonido();
        $('btn-sonido').textContent = silenciado ? 'Efectos: no' : 'Efectos: sí';
    });

    // Pausa
    $('boton-menu').addEventListener('click', () => acciones.alPausar());
    $('btn-reanudar').addEventListener('click', () => acciones.alReanudar());
    $('btn-pausa-reiniciar').addEventListener('click', () => acciones.alReiniciar());
    $('btn-salir').addEventListener('click', () => acciones.alSalir());

    // Resultado
    $('btn-reintentar').addEventListener('click', () => acciones.alReiniciar());
    $('btn-res-menu').addEventListener('click', () => acciones.alSalir());
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

    /* Pausa */
    export function mostrarPausa() {
    $('pausa').hidden = false;
    }

    export function ocultarPausa() {
    $('pausa').hidden = true;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }

    export function pausaAbierta() {
    return !$('pausa').hidden;
    }

    export function resultadoAbierto() {
    return !$('resultado').hidden;
    }

    export function pantallaAbierta() {
    return menuAbierto() || pausaAbierta() || resultadoAbierto();
    }

    export function setEstadoVR(disponible, mensaje) {
    $('btn-vr').disabled = !disponible;
    $('nota-vr').textContent = mensaje;
    }

    export function setRecord(valor) {
    $('menu-record').textContent = String(valor);
    }

    /* Marcador y radar */
    export function mostrarHUD(visible) {
    $('hud-juego').hidden = !visible;
    $('radar').hidden = !visible;
    $('boton-menu').hidden = !visible;
    }

    export function actualizarHUD({ modo, tiempo, recogidos, total, puntos, goles, pulso, efectos }) {
    $('hud-juego').dataset.modo = modo === 'libre' ? 'libre' : 'cristales';
    poner('hud-tiempo', formatoTiempo(tiempo));
    poner('hud-cristales', `${recogidos}/${total}`);
    poner('hud-puntos', String(puntos));
    poner('hud-goles', String(goles));
    poner('hud-pulso', pulso);
    poner('hud-efectos', efectos);
    }

    // Mapa visto desde arriba, con la misma orientación que la cámara de inicio
    export function dibujarRadar({ jugador, cristales, placas, poder = null, porteria, limite }) {
    const lienzo = $('radar');
    if (!lienzo || lienzo.hidden) return;
    const ctx = lienzo.getContext('2d');
    const w = lienzo.width;
    const h = lienzo.height;
    const escala = (w - 16) / (limite * 2);
    const px = (x) => w / 2 - x * escala;
    const pz = (z) => h / 2 - z * escala;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(14, 30, 22, 0.78)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(127, 176, 105, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    ctx.fillStyle = '#6dffa8';
    ctx.fillRect(px(porteria.x) - 9, pz(porteria.z) - 3, 18, 6);

    for (const pl of placas) {
        ctx.fillStyle = pl.activa ? '#2bff88' : '#4d7f95';
        ctx.fillRect(px(pl.x) - 4, pz(pl.z) - 4, 8, 8);
    }

    ctx.fillStyle = '#5ff2ff';
    for (const c of cristales) {
        ctx.beginPath();
        ctx.arc(px(c.x), pz(c.z), 3, 0, Math.PI * 2);
        ctx.fill();
    }

    if (poder) {
        ctx.fillStyle = `#${poder.color.toString(16).padStart(6, '0')}`;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px(poder.x), pz(poder.z), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    ctx.save();
    ctx.translate(px(jugador.x), pz(jugador.z));
    ctx.rotate(-jugador.mirada);
    ctx.fillStyle = '#ffd37a';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5, 6);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
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
    const puzzle = r.puzzle ? ' Puzzle de placas resuelto.' : '';
    $('res-detalle').textContent = `Cristales: ${r.recogidos} de ${r.total}. Goles: ${r.goles}. Tiempo usado: ${r.tiempoUsado} s.${bono}${puzzle}`;
    $('res-record').textContent = r.esRecord ? '¡Nuevo récord!' : `Récord: ${r.record} puntos`;
    $('resultado').hidden = false;
    }

    export function ocultarResultado() {
    $('resultado').hidden = true;
    }

    /* Estado del personaje y carga */
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