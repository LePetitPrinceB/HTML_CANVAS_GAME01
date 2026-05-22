class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;

    const angulo = Math.random() * Math.PI * 2;
    const velocidad = 1.5 + Math.random() * 3.5;

    this.vx = Math.cos(angulo) * velocidad;
    this.vy = Math.sin(angulo) * velocidad;

    this.vida = 1.0;
    this.decaimiento = 0.022 + Math.random() * 0.018;

    this.radio = 2 + Math.random() * 3;
    this.radioInicial = this.radio;

    this.gravedad = 0.08;
    this.friccion = 0.97;
  }

  actualizar() {
    this.vy += this.gravedad;
    this.vx *= this.friccion;
    this.vy *= this.friccion;

    this.x += this.vx;
    this.y += this.vy;

    this.vida -= this.decaimiento;
    this.radio = this.radioInicial * this.vida;
  }

  dibujar(ctx) {
    if (this.vida <= 0) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, this.vida);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.1, this.radio), 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.restore();
  }

  estaViva() {
    return this.vida > 0;
  }
}