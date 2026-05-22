(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  function redimensionar() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  redimensionar();

  const juego = new Game(canvas);

  window.addEventListener('resize', () => {
    redimensionar();
    juego._calcularDimensiones();
    juego.iniciarTablero();
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (juego.juegoTerminado) {
      juego.verificarClicVictoria(mx, my);
    } else {
      juego.manejarClic(mx, my);
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let sobreCartaOBoton = false;

    if (juego.juegoTerminado && juego._btnRestart) {
      const { x, y, w, h } = juego._btnRestart;
      if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
        sobreCartaOBoton = true;
      }
    } else {
      sobreCartaOBoton = juego.cartas.some(c =>
        c.verificarClic(mx, my) &&
        c.estado === 'oculta' &&
        !c.animando
      );
    }

    canvas.style.cursor = sobreCartaOBoton ? 'pointer' : 'default';
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;

    if (juego.juegoTerminado) {
      juego.verificarClicVictoria(mx, my);
    } else {
      juego.manejarClic(mx, my);
    }
  }, { passive: false });

})();