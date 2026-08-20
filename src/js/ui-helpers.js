/* ============================================================
   FranCat CR — Módulo 2 · ui-helpers.js
   Helpers reutilizables de UI (estética Y2K webcore)
   RF-10  → Modales de carga pixel con spinner retro
            ("Cargando datos con IA... ✨")
   RF-11  → Modales de error amigables, no técnicos
   Extra  → Sparkles de cursor, floating emojis, toasts,
            utilidades de formateo y DOM (esc, currency, fecha)
   ============================================================ */

/* ---------- Estado interno ---------- */
let activeModal = null;

/* ---------- Utilidades de formato ---------- */
export function esc(value) {
  const AMP = String.fromCharCode(38);
  const LT = String.fromCharCode(60);
  const GT = String.fromCharCode(62);
  const QUOT = String.fromCharCode(34);
  const APOS = String.fromCharCode(39);
  return String(value ?? '')
    .replace(new RegExp(AMP, 'g'), AMP + 'amp;')
    .replace(new RegExp(LT, 'g'), AMP + 'lt;')
    .replace(new RegExp(GT, 'g'), AMP + 'gt;')
    .replace(new RegExp(QUOT, 'g'), AMP + 'quot;')
    .replace(new RegExp(APOS, 'g'), AMP + '#039;');
}

export function formatCurrency(n) {
  const num = Number(n) || 0;
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function formatNumber(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(iso)} ${hh}:${min}`;
}

/* ---------- Modal base (overscroll-safe) ---------- */
export function openModal(htmlContent, { width = '620px' } = {}) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.dataset.uiModal = 'overlay';

  const modal = document.createElement('div');
  modal.className = 'pixel-modal';
  modal.style.maxWidth = width;
  modal.innerHTML = htmlContent;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  activeModal = overlay;

  const onKey = (e) => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', onKey);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Guardar el handler para poder quitarlo al cerrar
  modal.addEventListener('ui-close', () => document.removeEventListener('keydown', onKey));

  const closeBtn = modal.querySelector('[data-close-modal]');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal());
  }

  return modal;
}

export function closeModal() {
  if (activeModal) {
    activeModal.remove();
    activeModal = null;
  }
}

/* ---------- RF-10: Modal de carga con spinner retro ---------- */
export function showLoading({
  title = 'Cargando datos con IA... ✨',
  hint = 'analizando compromisos en el mainframe',
} = {}) {
  const html = `
    <div class="loading-box">
      <div class="retro-spinner"><span class="spinner-core">🍓</span></div>
      <div class="loading-title">${esc(title)}</div>
      <div class="pixel-progress"><span class="pixel-progress-fill"></span></div>
      <div class="loading-hint">// ${esc(hint)}</div>
    </div>
  `;
  const modal = openModal(html, { className: 'modal-loading' });
  modal.classList.add('modal-loading');
  return modal;
}

export function hideLoading() {
  closeModal();
}

/* ---------- RF-11: Error amigable y no técnico ---------- */
export function showFriendlyError({
  title = '¡Ups! Algo salió mal 💔',
  message = 'No pudimos conectar con el servidor. Intenta de nuevo en unos segundos.',
  code = '',
  icon = '🥺',
} = {}) {
  hideLoading();
  const detail = code ? `<div class="text-muted" style="margin-top:8px;">código: ${esc(code)}</div>` : '';
  const html = `
    <div class="error-box">
      <div class="error-icon">${icon}</div>
      <h3 class="error-title">${esc(title)}</h3>
      <p style="color:#44586a;">${esc(message)}</p>
      ${detail}
      <div class="modal-actions">
        <button class="pixel-btn soft" data-close-modal>Entendido 💕</button>
      </div>
    </div>
  `;
  return openModal(html, { width: '460px' });
}

/* ---------- Alerta genérica (éxito / info) ---------- */
export function showAlertModal({ title = 'Mensaje ✉️', message = '', type = 'ok' } = {}) {
  const icon = type === 'ok' ? 'verde' : type === 'warn' ? '⚠️' : '💬';
  const html = `
    <div class="error-box">
      <div class="error-icon">${icon}</div>
      <h3 class="${type === 'ok' ? 'card-title' : 'error-title'}">${esc(title)}</h3>
      <p style="color:#44586a;">${esc(message)}</p>
      <div class="modal-actions">
        <button class="pixel-btn ${type === 'ok' ? 'green' : ''}" data-close-modal>¡Perfecto! ✨</button>
      </div>
    </div>
  `;
  return openModal(html, { width: '460px' });
}

/* ---------- Toast pixel (feedback corto) ---------- */
let toastTimer = null;

export function showToast({ title = '¡Listo!', type = 'ok', duration = 2600 } = {}) {
  let toast = document.querySelector('.pixel-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'pixel-toast';
    document.body.appendChild(toast);
  }
  toast.className = 'pixel-toast ' + (type === 'error' ? 'toast-error' : 'toast-ok');
  toast.innerHTML = `${type === 'error' ? '🚨' : '✨'} ${esc(title)}`;
  toast.classList.add('visible');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), duration);
}

/* ---------- Sparkles de cursor (✨ 🌟 💖) ---------- */
let sparkleLayer = null;

export function initSparkles() {
  if (sparkleLayer) return;
  sparkleLayer = document.createElement('div');
  sparkleLayer.className = 'sparkle-layer';
  document.body.appendChild(sparkleLayer);

  const EMOJIS = ['✨', '🌟', '💖', '🩷', '⭐', '💫'];
  document.addEventListener('mousemove', (e) => {
    if (Math.random() > 0.35) return;
    const puff = document.createElement('span');
    puff.className = 'sparkle-puff';
    puff.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    puff.style.left = `${e.clientX + (Math.random() * 14 - 7)}px`;
    puff.style.top = `${e.clientY + (Math.random() * 14 - 7)}px`;
    puff.style.fontSize = `${12 + Math.random() * 14}px`;
    sparkleLayer.appendChild(puff);
    setTimeout(() => puff.remove(), 1600);
  });
}

/* ---------- Emojis flotantes de fondo ---------- */
let floatStarted = false;

export function initFloatingEmojis({
  emojis = ['✨', '🩷', '⭐', '💖', '🍓', '🌸', '🍀', '🌙'],
  max = 14,
  interval = 900,
} = {}) {
  if (floatStarted) return;
  floatStarted = true;

  let bg = document.querySelector('.float-bg');
  if (!bg) {
    bg = document.createElement('div');
    bg.className = 'float-bg';
    document.body.appendChild(bg);
  }

  const spawn = () => {
    if (!document.body.contains(bg)) return;
    if (bg.children.length >= max) return;
    const emoji = document.createElement('span');
    emoji.className = 'float-emo';
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = `${Math.random() * 96}%`;
    emoji.style.fontSize = `${12 + Math.random() * 20}px`;
    emoji.style.animationDuration = `${6 + Math.random() * 8}s`;
    emoji.style.animationDelay = `${Math.random() * 2}s`;
    bg.appendChild(emoji);
    emoji.addEventListener('animationend', () => emoji.remove());
  };

  setInterval(spawn, interval);
  for (let x = 0; x < 8; x++) setTimeout(spawn, x * interval * 0.4);
}

/* ---------- Cierra un modal por data-close-modals ---------- */
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-close-modal]')) closeModal();
});

/* ---------- Errores de fetch = exclusivos → mensajes amigables ---------- */
export function friendlyErrorFrom(err, fallback = 'No pudimos conectar con el servidor (json-server en :3001).') {
  if (!err) return fallback;
  if (err.name === 'AbortError') return 'La conexión tardó demasiado. Intenta de nuevo.';
  if (err && err.status === 404) return 'No encontramos el recurso solicitado en el sistema.';
  if (err && err.status === 500) return 'El servidor tuvo un problema interno. Intenta más tarde.';
  if (err && err.status === 0) return fallback;
  return err.message || fallback;
}