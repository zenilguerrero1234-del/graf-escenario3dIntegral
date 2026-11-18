    const TECLAS_BLOQUEADAS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

    export class Teclado {
    constructor() {
        this.presionadas = new Set();
        this.acciones = new Map();

        this._alBajar = (e) => {
        const destino = e.target;
        if (destino && (destino.tagName === 'INPUT' || destino.tagName === 'TEXTAREA')) return;
        if (TECLAS_BLOQUEADAS.includes(e.code)) e.preventDefault();
        this.presionadas.add(e.code);
        if (e.repeat) return;
        const lista = this.acciones.get(e.code);
        if (lista) lista.forEach((fn) => fn());
        };
        this._alSubir = (e) => this.presionadas.delete(e.code);
        this._alPerderFoco = () => this.presionadas.clear();

        window.addEventListener('keydown', this._alBajar);
        window.addEventListener('keyup', this._alSubir);
        window.addEventListener('blur', this._alPerderFoco);
    }

    estaPresionada(codigo) {
        return this.presionadas.has(codigo);
    }

    alPulsar(codigos, funcion) {
        for (const codigo of codigos) {
        if (!this.acciones.has(codigo)) this.acciones.set(codigo, []);
        this.acciones.get(codigo).push(funcion);
        }
    }

    liberar() {
        window.removeEventListener('keydown', this._alBajar);
        window.removeEventListener('keyup', this._alSubir);
        window.removeEventListener('blur', this._alPerderFoco);
        this.presionadas.clear();
        this.acciones.clear();
    }
    }