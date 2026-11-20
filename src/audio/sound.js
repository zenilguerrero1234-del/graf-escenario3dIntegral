    export class Sonido {
    constructor() {
        this.ctx = null;
        this.silenciado = false;
    }

    // Debe llamarse tras un clic del usuario, si no el navegador bloquea el audio
    activar() {
        if (!this.ctx) {
        const Contexto = window.AudioContext || window.webkitAudioContext;
        if (!Contexto) return;
        this.ctx = new Contexto();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    alternar() {
        this.silenciado = !this.silenciado;
        return this.silenciado;
    }

    nota(frecuencia, duracion = 0.15, tipo = 'sine', volumen = 0.15, retraso = 0) {
        if (!this.ctx || this.silenciado) return;
        const inicio = this.ctx.currentTime + retraso;
        const osc = this.ctx.createOscillator();
        const ganancia = this.ctx.createGain();
        osc.type = tipo;
        osc.frequency.setValueAtTime(frecuencia, inicio);
        ganancia.gain.setValueAtTime(0.0001, inicio);
        ganancia.gain.exponentialRampToValueAtTime(volumen, inicio + 0.02);
        ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
        osc.connect(ganancia).connect(this.ctx.destination);
        osc.start(inicio);
        osc.stop(inicio + duracion + 0.05);
    }

    inicio() {
        [392, 523, 659].forEach((f, i) => this.nota(f, 0.18, 'triangle', 0.12, i * 0.1));
    }

    cristal() {
        this.nota(880, 0.12, 'triangle');
        this.nota(1320, 0.18, 'triangle', 0.12, 0.08);
    }

    gol() {
        [523, 659, 784, 1047].forEach((f, i) => this.nota(f, 0.2, 'square', 0.08, i * 0.09));
    }

    fin(completado) {
        const notas = completado ? [523, 659, 784, 1047, 1319] : [392, 330, 262];
        notas.forEach((f, i) => this.nota(f, 0.25, 'triangle', 0.12, i * 0.13));
    }
    }