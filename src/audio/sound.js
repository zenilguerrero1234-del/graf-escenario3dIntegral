    const mf = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

    // Progresión en la menor: Am, F, C, G
    const ACORDES = [
    { notas: [57, 60, 64, 69], bajo: 45 },
    { notas: [53, 57, 60, 65], bajo: 41 },
    { notas: [60, 64, 67, 72], bajo: 48 },
    { notas: [55, 59, 62, 67], bajo: 43 }
    ];
    const PATRON_ARPEGIO = [0, 2, 1, 3, 2, 3, 1, 2];
    const PENTATONICA = [69, 72, 74, 76, 79, 81];

    class Musica {
    constructor(sonido) {
        this.sonido = sonido;
        this.activa = false;
        this.silenciada = false;
        this.tension = false;
        this.paso = 0;
        this.proximo = 0;
        this.temporizador = null;
        this.maestro = null;
        this.entrada = null;
    }

    iniciar() {
        const ctx = this.sonido.ctx;
        if (!ctx || this.activa) return;
        this.activa = true;

        this.maestro = ctx.createGain();
        this.maestro.gain.value = this.silenciada ? 0 : 0.55;
        this.maestro.connect(ctx.destination);

        // Eco largo para dar sensación de bosque amplio
        const reverb = ctx.createConvolver();
        reverb.buffer = this.crearImpulso(ctx, 2.6, 2.2);
        const seco = ctx.createGain();
        seco.gain.value = 0.75;
        const humedo = ctx.createGain();
        humedo.gain.value = 0.5;

        this.entrada = ctx.createGain();
        this.entrada.connect(seco).connect(this.maestro);
        this.entrada.connect(reverb).connect(humedo).connect(this.maestro);

        this.proximo = ctx.currentTime + 0.15;
        this.paso = 0;
        this.temporizador = setInterval(() => this.programar(), 100);
        this.viento();
    }

    silenciar(valor) {
        this.silenciada = valor;
        const ctx = this.sonido.ctx;
        if (this.maestro && ctx) {
        this.maestro.gain.setTargetAtTime(valor ? 0 : 0.55, ctx.currentTime, 0.1);
        }
    }

    setTension(valor) {
        this.tension = valor;
    }

    crearImpulso(ctx, segundos, decaimiento) {
        const largo = Math.floor(ctx.sampleRate * segundos);
        const buffer = ctx.createBuffer(2, largo, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
        const datos = buffer.getChannelData(c);
        for (let i = 0; i < largo; i++) {
            datos[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, decaimiento);
        }
        }
        return buffer;
    }

    viento() {
        const ctx = this.sonido.ctx;
        const largo = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
        const datos = buffer.getChannelData(0);
        for (let i = 0; i < largo; i++) datos[i] = Math.random() * 2 - 1;

        const fuente = ctx.createBufferSource();
        fuente.buffer = buffer;
        fuente.loop = true;
        const filtro = ctx.createBiquadFilter();
        filtro.type = 'bandpass';
        filtro.frequency.value = 500;
        filtro.Q.value = 0.6;
        const ganancia = ctx.createGain();
        ganancia.gain.value = 0.035;

        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.08;
        const profundidad = ctx.createGain();
        profundidad.gain.value = 220;
        lfo.connect(profundidad).connect(filtro.frequency);

        fuente.connect(filtro).connect(ganancia).connect(this.maestro);
        fuente.start();
        lfo.start();
    }

    programar() {
        const ctx = this.sonido.ctx;
        if (!ctx) return;
        const duracionPaso = this.tension ? 0.26 : 0.4;
        while (this.proximo < ctx.currentTime + 0.6) {
        this.tocarPaso(this.paso, this.proximo, duracionPaso);
        this.proximo += duracionPaso;
        this.paso++;
        }
    }

    tocarPaso(paso, t, d) {
        const acorde = ACORDES[Math.floor(paso / 8) % ACORDES.length];
        const enCompas = paso % 8;

        if (enCompas === 0) {
        for (const m of acorde.notas) this.voz(mf(m), t, d * 8, 'sine', 0.035, d * 2.5, true);
        this.voz(mf(acorde.bajo), t, d * 3.5, 'triangle', 0.09, 0.05);
        }
        if (enCompas === 4) this.voz(mf(acorde.bajo), t, d * 2.5, 'triangle', 0.06, 0.05);

        this.voz(mf(acorde.notas[PATRON_ARPEGIO[enCompas] % acorde.notas.length] + 12), t, d * 1.8, 'triangle', 0.045, 0.01);

        if ((enCompas === 2 || enCompas === 6) && Math.random() < 0.55) {
        const m = PENTATONICA[Math.floor(Math.random() * PENTATONICA.length)];
        this.voz(mf(m), t + d * 0.5, d * 3, 'sine', 0.05, 0.02);
        }
    }

    voz(frecuencia, inicio, duracion, tipo, volumen, ataque, desafinar = false) {
        const ctx = this.sonido.ctx;
        const osc = ctx.createOscillator();
        const ganancia = ctx.createGain();
        osc.type = tipo;
        osc.frequency.setValueAtTime(frecuencia, inicio);
        if (desafinar) osc.detune.value = (Math.random() - 0.5) * 8;
        const subida = Math.min(ataque, duracion * 0.5);
        ganancia.gain.setValueAtTime(0.0001, inicio);
        ganancia.gain.linearRampToValueAtTime(volumen, inicio + subida);
        ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
        osc.connect(ganancia).connect(this.entrada);
        osc.start(inicio);
        osc.stop(inicio + duracion + 0.1);
    }
    }

    export class Sonido {
    constructor() {
        this.ctx = null;
        this.silenciado = false;
        this.musica = new Musica(this);
    }

    // Debe llamarse tras un clic o una tecla del usuario, si no el navegador bloquea el audio
    activar() {
        if (!this.ctx) {
        const Contexto = window.AudioContext || window.webkitAudioContext;
        if (!Contexto) return;
        this.ctx = new Contexto();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.musica.iniciar();
    }

    // Efectos de sonido
    alternar() {
        this.silenciado = !this.silenciado;
        return this.silenciado;
    }

    // Música de fondo
    alternarMusica() {
        this.musica.silenciar(!this.musica.silenciada);
        return this.musica.silenciada;
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

    cristal(combo = 1) {
        const subida = 1 + 0.25 * (combo - 1);
        this.nota(880 * subida, 0.12, 'triangle');
        this.nota(1320 * subida, 0.18, 'triangle', 0.12, 0.08);
    }

    gol() {
        [523, 659, 784, 1047].forEach((f, i) => this.nota(f, 0.2, 'square', 0.08, i * 0.09));
    }

    patada() {
        this.nota(140, 0.12, 'sine', 0.22);
        this.nota(90, 0.18, 'sine', 0.18, 0.02);
    }

    agarrar() {
        this.nota(440, 0.08, 'triangle', 0.1);
        this.nota(587, 0.1, 'triangle', 0.1, 0.06);
    }

    soltar() {
        this.nota(587, 0.08, 'triangle', 0.1);
        this.nota(392, 0.12, 'triangle', 0.1, 0.06);
    }

    pulso() {
        [330, 494, 740, 988].forEach((f, i) => this.nota(f, 0.35, 'sine', 0.1, i * 0.06));
    }

    placa() {
        this.nota(659, 0.15, 'triangle', 0.12);
        this.nota(988, 0.2, 'triangle', 0.1, 0.07);
    }

    puzzle() {
        [523, 659, 784, 988, 1175, 1568].forEach((f, i) => this.nota(f, 0.25, 'triangle', 0.1, i * 0.08));
    }

    fin(completado) {
        const notas = completado ? [523, 659, 784, 1047, 1319] : [392, 330, 262];
        notas.forEach((f, i) => this.nota(f, 0.25, 'triangle', 0.12, i * 0.13));
    }
    }