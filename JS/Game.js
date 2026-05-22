class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.cartas = [];
    this.particulas = [];
    this.carta1 = null;
    this.carta2 = null;
    this.bloquearTablero = false;

    this.movimientos = 0;
    this.paresEncontrados = 0;
    this.totalPares = 8;

    this.timerSegundos = 0;
    this.timerInterval = null;
    this.juegoTerminado = false;
    this.juegoIniciado = false;

    this.cursorVisible = true;
    this.cursorInterval = null;

    this.simbolos = ['{}', '<>', '//', '()', '##', '[]', '=>', ';;'];

    this.audioCtx = null;

    this.cardWidth = 0;
    this.cardHeight = 0;
    this.cols = 4;
    this.rows = 4;
    this.gap = 0;
    this.offsetX = 0;
    this.offsetY = 0;

    this._calcularDimensiones();
    this._iniciarCursor();
    this.iniciarTablero();
    this.bucle();
  }

  _calcularDimensiones() {
    const W = this.canvas.width;
    const H = this.canvas.height;

    const areaJuegoW = W * 0.72;
    const areaJuegoH = H * 0.68;

    this.gap = Math.floor(Math.min(W, H) * 0.018);
    this.cardWidth  = Math.floor((areaJuegoW - this.gap * (this.cols - 1)) / this.cols);
    this.cardHeight = Math.floor((areaJuegoH - this.gap * (this.rows - 1)) / this.rows);

    const gridW = this.cardWidth  * this.cols + this.gap * (this.cols - 1);
    const gridH = this.cardHeight * this.rows + this.gap * (this.rows - 1);

    this.offsetX = Math.floor((W - gridW) / 2);
    this.offsetY = Math.floor(H * 0.22);
  }

  _iniciarCursor() {
    this.cursorInterval = setInterval(() => {
      this.cursorVisible = !this.cursorVisible;
    }, 530);
  }

  _iniciarAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  _reproducirSonido(tipo) {
    this._iniciarAudio();
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (tipo === 'match') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(780, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else if (tipo === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    } else if (tipo === 'victoria') {
      const frecuencias = [520, 660, 780, 1040];
      frecuencias.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.13);
        g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.13);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.13 + 0.4);
        o.start(ctx.currentTime + i * 0.13);
        o.stop(ctx.currentTime + i * 0.13 + 0.4);
      });
    }
  }

  _fisherYates(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  iniciarTablero() {
    this.cartas = [];
    this.carta1 = null;
    this.carta2 = null;
    this.bloquearTablero = false;
    this.movimientos = 0;
    this.paresEncontrados = 0;
    this.juegoTerminado = false;
    this.juegoIniciado = false;
    this.particulas = [];

    clearInterval(this.timerInterval);
    this.timerSegundos = 0;

    const simbolosDuplicados = this._fisherYates([...this.simbolos, ...this.simbolos]);

    simbolosDuplicados.forEach((simbolo, i) => {
      const col = i % this.cols;
      const row = Math.floor(i / this.cols);
      const x = this.offsetX + col * (this.cardWidth + this.gap);
      const y = this.offsetY + row * (this.cardHeight + this.gap);

      this.cartas.push(new Card(x, y, this.cardWidth, this.cardHeight, simbolo));
    });
  }

  _iniciarTimer() {
    this.timerInterval = setInterval(() => {
      if (!this.juegoTerminado) this.timerSegundos++;
    }, 1000);
  }

  _emitirParticulas(cx, cy, color) {
    for (let i = 0; i < 14; i++) {
      this.particulas.push(new Particle(cx, cy, color));
    }
  }

  manejarClic(mx, my) {
    if (this.bloquearTablero || this.juegoTerminado) return;

    const carta = this.cartas.find(c =>
      c.verificarClic(mx, my) &&
      c.estado === 'oculta' &&
      !c.animando
    );

    if (!carta) return;

    if (!this.juegoIniciado) {
      this.juegoIniciado = true;
      this._iniciarTimer();
    }

    carta.voltear();

    if (!this.carta1) {
      this.carta1 = carta;
      return;
    }

    if (this.carta1 === carta) return;

    this.carta2 = carta;
    this.movimientos++;
    this.bloquearTablero = true;

    setTimeout(() => {
      this._evaluarPar();
    }, 750);
  }

  _evaluarPar() {
    const { carta1, carta2 } = this;

    if (carta1.symbol === carta2.symbol) {
      carta1.estado = 'emparejada';
      carta2.estado = 'emparejada';

      const cx1 = carta1.x + carta1.width / 2;
      const cy1 = carta1.y + carta1.height / 2;
      const cx2 = carta2.x + carta2.width / 2;
      const cy2 = carta2.y + carta2.height / 2;

      this._emitirParticulas(cx1, cy1, '#34D399');
      this._emitirParticulas(cx2, cy2, '#34D399');
      this._reproducirSonido('match');

      this.paresEncontrados++;

      if (this.paresEncontrados === this.totalPares) {
        clearInterval(this.timerInterval);
        this.juegoTerminado = true;
        this._reproducirSonido('victoria');
      }
    } else {
      carta1.estado = 'revelada';
      carta2.estado = 'revelada';

      carta1.colorSeleccionada = '#F85149';
      carta2.colorSeleccionada = '#F85149';

      this._reproducirSonido('error');

      setTimeout(() => {
        carta1.voltear();
        carta2.voltear();

        setTimeout(() => {
          carta1.colorSeleccionada = '#8AB4F8';
          carta2.colorSeleccionada = '#8AB4F8';
        }, 400);
      }, 300);
    }

    this.carta1 = null;
    this.carta2 = null;
    this.bloquearTablero = false;
  }

  _formatearTiempo(seg) {
    const m = Math.floor(seg / 60).toString().padStart(2, '0');
    const s = (seg % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  _dibujarHUD(ctx) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const cursor = this.cursorVisible ? '█' : ' ';

    ctx.fillStyle = '#8AB4F8';
    ctx.font = `bold ${Math.floor(H * 0.042)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#8AB4F8';
    ctx.shadowBlur = 10;
    ctx.fillText(`> Dev_Match! ${cursor}`, Math.floor(W * 0.04), Math.floor(H * 0.04));
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#4A5568';
    ctx.font = `${Math.floor(H * 0.022)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`// v1.0.0 — Empareja todas las cartas para ganar`, Math.floor(W * 0.04), Math.floor(H * 0.10));

    const statY = Math.floor(H * 0.135);
    const statSize = Math.floor(H * 0.024);

    ctx.font = `${statSize}px 'JetBrains Mono', monospace`;

    const labelX = Math.floor(W * 0.04);
    ctx.fillStyle = '#4A5568';
    ctx.textAlign = 'left';
    ctx.fillText('movimientos:', labelX, statY);
    const anchoMov = ctx.measureText('movimientos:').width;
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(this.movimientos.toString().padStart(3, '0'), labelX + anchoMov + 8, statY);

    const textoTiempoCompleto = `tiempo: ${this._formatearTiempo(this.timerSegundos)}`;
    const anchoTiempoCompleto = ctx.measureText(textoTiempoCompleto).width;
    const tiempoX = W / 2 - anchoTiempoCompleto / 2;
    ctx.fillStyle = '#4A5568';
    ctx.textAlign = 'left';
    ctx.fillText('tiempo:', tiempoX, statY);
    const anchoLabelTiempo = ctx.measureText('tiempo: ').width;
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(this._formatearTiempo(this.timerSegundos), tiempoX + anchoLabelTiempo, statY);

    const valorPares = `${this.paresEncontrados}/${this.totalPares}`;
    const anchoPares = ctx.measureText(valorPares).width;
    const paresDerecha = W - Math.floor(W * 0.04);
    ctx.fillStyle = '#4A5568';
    ctx.textAlign = 'right';
    ctx.fillText('pares:', paresDerecha - anchoPares - 8, statY);
    ctx.fillStyle = '#34D399';
    ctx.fillText(valorPares, paresDerecha, statY);

    const lineY = statY + statSize * 1.8;
    ctx.strokeStyle = '#1E2638';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.floor(W * 0.04), lineY);
    ctx.lineTo(W - Math.floor(W * 0.04), lineY);
    ctx.stroke();
  }

  _dibujarVictoria(ctx) {
    const W = this.canvas.width;
    const H = this.canvas.height;

    ctx.fillStyle = 'rgba(9, 11, 16, 0.82)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#34D399';
    ctx.font = `bold ${Math.floor(H * 0.058)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#34D399';
    ctx.shadowBlur = 18;
    ctx.fillText('// PUZZLE COMPLETO', W / 2, H * 0.36);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#8AB4F8';
    ctx.font = `${Math.floor(H * 0.03)}px 'JetBrains Mono', monospace`;
    ctx.fillText(`tiempo   : ${this._formatearTiempo(this.timerSegundos)}`, W / 2, H * 0.46);
    ctx.fillText(`movimientos  : ${this.movimientos}`, W / 2, H * 0.52);

    const btnW = Math.floor(W * 0.28);
    const btnH = Math.floor(H * 0.068);
    const btnX = W / 2 - btnW / 2;
    const btnY = H * 0.62;

    ctx.strokeStyle = '#8AB4F8';
    ctx.lineWidth = 1;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = '#8AB4F8';
    ctx.font = `${Math.floor(H * 0.028)}px 'JetBrains Mono', monospace`;
    ctx.fillText('> reiniciar_', W / 2, btnY + btnH / 2);

    this._btnRestart = { x: btnX, y: btnY, w: btnW, h: btnH };
  }

  verificarClicVictoria(mx, my) {
    if (!this.juegoTerminado || !this._btnRestart) return;
    const { x, y, w, h } = this._btnRestart;
    if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
      this._calcularDimensiones();
      this.iniciarTablero();
    }
  }

  dibujar() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#090B10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this._dibujarHUD(ctx);

    this.cartas.forEach(c => c.dibujar(ctx));

    this.particulas = this.particulas.filter(p => p.estaViva());
    this.particulas.forEach(p => {
      p.actualizar();
      p.dibujar(ctx);
    });

    if (this.juegoTerminado) {
      this._dibujarVictoria(ctx);
    }
  }

  bucle() {
    this.cartas.forEach(c => c.actualizar());
    this.dibujar();
    requestAnimationFrame(() => this.bucle());
  }
}