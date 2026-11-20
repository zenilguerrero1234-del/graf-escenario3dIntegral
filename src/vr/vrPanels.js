    import * as THREE from 'three';
    import { CONTROLES_VR } from '../ui/interface.js';

    function nuevoPanel(ancho, alto, anchoMundo, probarProfundidad) {
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext('2d');
    const textura = new THREE.CanvasTexture(lienzo);
    textura.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({
        map: textura,
        transparent: true,
        toneMapped: false,
        fog: false,
        depthTest: probarProfundidad
    });
    const malla = new THREE.Mesh(new THREE.PlaneGeometry(anchoMundo, (anchoMundo * alto) / ancho), material);
    malla.renderOrder = 10;
    malla.visible = false;
    return { malla, ctx, textura, ancho, alto };
    }

    function fondo(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(14, 30, 22, 0.92)';
    ctx.strokeStyle = '#7fb069';
    ctx.lineWidth = 6;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(4, 4, w - 8, h - 8, 36);
    else ctx.rect(4, 4, w - 8, h - 8);
    ctx.fill();
    ctx.stroke();
    }

    function formatoTiempo(segundos) {
    const s = Math.ceil(segundos);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }

    export function crearPanelAyudaVR() {
    const p = nuevoPanel(1300, 880, 1.6, true);
    const { ctx, ancho, alto } = p;
    fondo(ctx, ancho, alto);
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#9be07a';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.fillText('Controles de Meta Quest 3S', 44, 34);

    let y = 112;
    for (const [mando, accion] of CONTROLES_VR) {
        ctx.font = 'bold 32px Arial, sans-serif';
        ctx.fillStyle = '#ffd37a';
        ctx.fillText(mando, 44, y);
        ctx.font = '30px Arial, sans-serif';
        ctx.fillStyle = '#f4f7f2';
        ctx.fillText(accion, 520, y + 1);
        y += 62;
    }
    ctx.font = '28px Arial, sans-serif';
    ctx.fillStyle = '#c9d1cf';
    ctx.fillText('Botón Y: ocultar este panel', 44, alto - 56);
    p.textura.needsUpdate = true;
    return p;
    }

    export function crearPanelHUDVR() {
    const p = nuevoPanel(1024, 220, 0.9, false);
    p.firma = '';

    p.actualizar = (juego) => {
        const r = juego.resultado;
        let linea1;
        let linea2;
        if (juego.modo === 'fin' && r) {
        linea1 = `Fin de la partida: ${r.puntos} puntos${r.esRecord ? ' (récord)' : ''}`;
        linea2 = `${'★'.repeat(r.estrellas)}${'☆'.repeat(3 - r.estrellas)}  Gatillo o botón A: otra vez`;
        } else if (juego.modo === 'libre') {
        linea1 = 'Modo libre';
        linea2 = `Goles ${juego.goles}     Pulso ${juego.enfriamientoPulso > 0 ? Math.ceil(juego.enfriamientoPulso) + ' s' : 'Listo'}`;
        } else {
        linea1 = `Tiempo ${formatoTiempo(juego.tiempo)}     Cristales ${juego.recogidos}/${juego.total}`;
        linea2 = `Puntos ${juego.puntos}   Goles ${juego.goles}   Pulso ${juego.enfriamientoPulso > 0 ? Math.ceil(juego.enfriamientoPulso) + ' s' : 'Listo'}`;
        }
        const firma = `${linea1}|${linea2}`;
        if (firma === p.firma) return;
        p.firma = firma;

        fondo(p.ctx, p.ancho, p.alto);
        p.ctx.textBaseline = 'middle';
        p.ctx.textAlign = 'center';
        p.ctx.font = 'bold 44px Arial, sans-serif';
        p.ctx.fillStyle = '#ffd37a';
        p.ctx.fillText(linea1, p.ancho / 2, 76);
        p.ctx.fillStyle = '#f4f7f2';
        p.ctx.fillText(linea2, p.ancho / 2, 150);
        p.textura.needsUpdate = true;
    };

    return p;
    }