class Card {
  constructor(x, y, width, height, symbol) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.symbol = symbol;

    this.estado = 'oculta';
    this.escalaX = 1.0;
    this.fase = null;
    this.animando = false;

    this.colorFrente = '#1E2638';
    this.colorDorso = '#151B26';
    this.colorBorde = '#2A3241';
    this.colorSeleccionada = '#8AB4F8';
    this.colorEmparejada = '#34D399';
    this.colorError = '#F85149';

    this.glowIntensidad = 0;
    this.glowDireccion = 1;
  }

  easeInOut(t) {
    return t < 0.5
      ? 2 * t * t
      : -1 + (4 - 2 * t) * t;
  }

  voltear() {
    if (this.animando || this.estado === 'emparejada') return;
    this.animando = true;
    this.fase = 'cerrando';
    this._progresoFlip = 0;
  }

  actualizar() {
    if (this.animando) {
      this._progresoFlip += 0.05;

      if (this._progresoFlip > 1) this._progresoFlip = 1;

      const easedProgress = this.easeInOut(this._progresoFlip);

      if (this.fase === 'cerrando') {
        this.escalaX = 1 - easedProgress;

        if (this._progresoFlip >= 1) {
          this.escalaX = 0;
          this.estado = this.estado === 'oculta' ? 'revelada' : 'oculta';
          this.fase = 'abriendo';
          this._progresoFlip = 0;
        }
      } else if (this.fase === 'abriendo') {
        this.escalaX = easedProgress;

        if (this._progresoFlip >= 1) {
          this.escalaX = 1;
          this.animando = false;
          this.fase = null;
        }
      }
    }

    if (this.estado === 'emparejada') {
      this.glowIntensidad += 0.05 * this.glowDireccion;
      if (this.glowIntensidad >= 1) this.glowDireccion = -1;
      if (this.glowIntensidad <= 0) this.glowDireccion = 1;
    }
  }

  obtenerColorActual() {
    if (this.estado === 'emparejada') return this.colorEmparejada;
    if (this.estado === 'revelada') return this.colorSeleccionada;
    return this.colorBorde;
  }

  dibujar(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(this.escalaX, 1);

    const colorBorde = this.obtenerColorActual();

    if (this.estado === 'emparejada') {
      const glowSize = 8 + this.glowIntensidad * 12;
      ctx.shadowColor = this.colorEmparejada;
      ctx.shadowBlur = glowSize;
    } else if (this.estado === 'revelada') {
      ctx.shadowColor = this.colorSeleccionada;
      ctx.shadowBlur = 14;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    const relleno = this.estado === 'oculta' ? this.colorDorso : this.colorFrente;
    ctx.fillStyle = relleno;
    ctx.strokeStyle = colorBorde;
    ctx.lineWidth = this.estado === 'oculta' ? 1 : 1.5;

    this._dibujarRectRedondeado(ctx, -this.width / 2, -this.height / 2, this.width, this.height, 8);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    if (this.estado === 'oculta') {
      this._dibujarDorso(ctx);
    } else {
      this._dibujarFrente(ctx);
    }

    ctx.restore();
  }

  _dibujarRectRedondeado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  _dibujarDorso(ctx) {
    ctx.strokeStyle = '#2A3241';
    ctx.lineWidth = 0.5;

    const paso = 12;
    const hw = this.width / 2 - 8;
    const hh = this.height / 2 - 8;

    ctx.beginPath();
    for (let i = -hw; i <= hw; i += paso) {
      ctx.moveTo(i, -hh);
      ctx.lineTo(i, hh);
    }
    for (let j = -hh; j <= hh; j += paso) {
      ctx.moveTo(-hw, j);
      ctx.lineTo(hw, j);
    }
    ctx.stroke();

    ctx.strokeStyle = '#3A4556';
    ctx.lineWidth = 1;
    this._dibujarRectRedondeado(ctx, -this.width / 2 + 6, -this.height / 2 + 6, this.width - 12, this.height - 12, 5);
    ctx.stroke();
  }

  _dibujarFrente(ctx) {
    const color = this.estado === 'emparejada' ? this.colorEmparejada : this.colorSeleccionada;

    if (this.estado === 'emparejada') {
      ctx.shadowColor = this.colorEmparejada;
      ctx.shadowBlur = 10 + this.glowIntensidad * 8;
    }

    ctx.fillStyle = color;
    ctx.font = `bold ${this.height * 0.32}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.symbol, 0, 0);

    ctx.shadowBlur = 0;
  }

  verificarClic(mx, my) {
    return (
      mx >= this.x &&
      mx <= this.x + this.width &&
      my >= this.y &&
      my <= this.y + this.height
    );
  }
}