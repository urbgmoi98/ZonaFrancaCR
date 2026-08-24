/* ============================================================
   FranCat CR — Módulo 2 · neon-bg.js
   Fondo dinámico profesional estilo "hacker" con lluvia de
   código (matrix rain) en rosa neón sobre canvas.
   ------------------------------------------------------------
   - Se auto-inicializa al ser importado (efecto secundario).
   - Respeta prefers-reduced-motion (una sola pasada estática).
   - Pausa el bucle cuando la pestaña no es visible (perf).
   - Ajusta tamaño al redimensionar la ventana (debounce).
   ============================================================ */

const NEON_COLORS = ['#ff2bd6', '#ff4fe0', '#ff7ceb', '#ffa9f3', '#ffd0f7', '#e600c8'];
const DROP_HEAD_COLOR = '#ffffff';
const TRAIL_ALPHA = 0.075; // estela suave (más bajo = colas más largas)
const FONT_SIZE = 15;

/* ---------- Caracteres "hacker" ---------- */
const GLYPHS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
  'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ' +
  '{}[]<>/\\|;:=+-*#$%&@!' +
  '01';

/* ---------- Clase principal ---------- */
class LluviaNeon {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'neonBg';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    this.drops = [];
    this.frame = 0;
    this.reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._aplicarEstilos();
    document.body.prepend(this.canvas);
    this.resize();

    window.addEventListener('resize', this._debounce(() => this.resize(), 180));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(this._raf);
      } else {
        this._loop();
      }
    });

    if (this.reducido) {
      this.dibujarEstatico();
    } else {
      this._loop();
    }
  }

  _aplicarEstilos() {
    const s = this.canvas.style;
    s.position = 'fixed';
    s.inset = '0';
    s.width = '100vw';
    s.height = '100vh';
    s.zIndex = '-1';
    s.pointerEvents = 'none';
    s.display = 'block';
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    const cols = Math.ceil(this.canvas.width / FONT_SIZE);
    // Inicializar columnas a alturas aleatorias (lluvia distribuida)
    this.drops = Array.from({ length: cols }, () => Math.random() * -80);
    // Fondo base para la primera pasada
    this.ctx.fillStyle = '#0b0112';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _glifo() {
    return GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
  }

  _loop = () => {
    this._raf = requestAnimationFrame(this._loop);
    this.dibujar();
  };

  dibujar() {
    const { ctx } = this;
    // Estela: rectángulo semitransparente que "desvanece" lo anterior
    ctx.fillStyle = `rgba(11, 1, 18, ${TRAIL_ALPHA})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.font = `${FONT_SIZE}px 'Courier New', Consolas, monospace`;
    this.frame++;

    for (let i = 0; i < this.drops.length; i++) {
      const x = i * FONT_SIZE;
      const y = this.drops[i] * FONT_SIZE;

      // Cabeza del gota: más brillante
      ctx.shadowBlur = 14;
      ctx.fillStyle = DROP_HEAD_COLOR;
      ctx.fillText(this._glifo(), x, y);

      // Estela del gota
      ctx.shadowBlur = 8;
      ctx.fillStyle = NEON_COLORS[i % NEON_COLORS.length];
      ctx.fillText(this._glifo(), x, y - FONT_SIZE);
      ctx.fillStyle = NEON_COLORS[(i + 3) % NEON_COLORS.length];
      ctx.fillText(this._glifo(), x, y - FONT_SIZE * 2);
      ctx.shadowBlur = 0;

      // Reiniciar la columna cuando sale de la pantalla
      if (y > this.canvas.height && Math.random() > 0.972) {
        this.drops[i] = 0;
      }
      this.drops[i]++;
    }
  }

  dibujarEstatico() {
    // Una pasada estática respetando movimiento reducido
    for (let i = 0; i < this.drops.length; i++) {
      const x = i * FONT_SIZE;
      const y = Math.random() * this.canvas.height;
      ctx.fillStyle = NEON_COLORS[i % NEON_COLORS.length];
      ctx.font = `${FONT_SIZE}px 'Courier New', Consolas, monospace`;
      ctx.fillText(this._glifo(), x, y);
    }
  }

  _debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }
}

/* ---------- Arranque ---------- */
export function initNeonBg() {
  if (document.getElementById('neonBg')) return;
  return new LluviaNeon();
}

initNeonBg();
