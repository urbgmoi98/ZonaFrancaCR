/* ============================================================
   FranCat CR — Módulo 2 · pages/reporte.js
   Lógica del formulario de reporte trimestral (RF-06)
   ------------------------------------------------------------
   - Carga empresas desde json-server (solicitudes aprobadas)
   - Envía el reporte a http://localhost:3001/reportesCumplimiento
   - Usa ui-helpers para loading (RF-10) y errores amigables (RF-11)
   ============================================================ */

import {
  showLoading,
  hideLoading,
  showFriendlyError,
  showToast,
  initSparkles,
  initFloatingEmojis,
} from '../ui-helpers.js';

const API_BASE = 'http://localhost:3001';

/* ---------- Cargar empresas aprobadas para el select ---------- */
async function cargarEmpresas() {
  try {
    const res = await fetch(`${API_BASE}/solicitudes`);
    if (!res.ok) throw new Error('status ' + res.status);
    const solicitudes = await res.json();

    const select = document.getElementById('empresa');
    if (!select) return;

    // Limpiar opciones (mantener la primera placeholder)
    select.innerHTML = '<option value="">— Selecciona tu empresa —</option>';

    const aprobadas = (solicitudes || []).filter(
      (s) => String(s.estado).toLowerCase() === 'aprobada'
    );

    if (aprobadas.length === 0) {
      select.innerHTML = '<option value="">— No hay empresas aprobadas —</option>';
      return;
    }

    aprobadas.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = String(s.id);
      opt.textContent = `${s.empresa} (${s.sector})`;
      select.appendChild(opt);
    });
  } catch (err) {
    // No bloqueamos el formulario; dejamos las opciones estáticas del HTML
    console.warn('No se pudieron cargar empresas desde json-server:', err);
  }
}

/* ---------- Envío del reporte ---------- */
async function enviarReporte(payload) {
  const res = await fetch(`${API_BASE}/reportesCumplimiento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = new Error('El servidor respondió con estado ' + res.status);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/* ---------- Inicialización ---------- */
function init() {
  initSparkles();
  initFloatingEmojis();

  const form = document.getElementById('reporteForm');
  if (!form) return;

  cargarEmpresas();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validación simple
    const empresa = document.getElementById('empresa').value;
    const periodo = document.getElementById('periodo').value;
    const empleosReal = Number(document.getElementById('empleosReal').value);
    const inversionReal = Number(document.getElementById('inversionReal').value);
    const fechaEnvio = document.getElementById('fechaEnvio').value;

    if (!empresa || !periodo || !fechaEnvio) {
      showFriendlyError({
        title: 'Faltan datos importantes 🥺',
        message: 'Por favor completa empresa, período y fecha de envío antes de continuar.',
        icon: '📝',
      });
      return;
    }
    if (Number.isNaN(empleosReal) || empleosReal < 0) {
      showFriendlyError({
        title: 'Revisa los empleos 👷',
        message: 'El número de empleos debe ser un valor positivo.',
        icon: '👷',
      });
      return;
    }
    if (Number.isNaN(inversionReal) || inversionReal < 0) {
      showFriendlyError({
        title: 'Revisa la inversión 💰',
        message: 'El monto de inversión debe ser un valor positivo.',
        icon: '💰',
      });
      return;
    }

    const payload = {
      empresaId: Number(empresa),
      empresa: document.getElementById('empresa').selectedOptions[0]?.textContent?.split(' (')[0] || '',
      periodo,
      trimestre: Number(periodo.split('-')[1].replace('Q', '')) || 0,
      ano: Number(periodo.split('-')[0]) || new Date().getFullYear(),
      inversionReal,
      empleosReal,
      exportacionesReal: Number(document.getElementById('exportacionesReal').value) || 0,
      nominaTotal: Number(document.getElementById('nominaTotal').value) || 0,
      proveedoresLocales: Number(document.getElementById('proveedoresLocales').value) || 0,
      fechaEnvio,
      recibido: true,
      notas: document.getElementById('notas').value || '',
    };

    showLoading({
      title: 'Cargando datos con IA... ✨',
      hint: 'enviando reporte al mainframe de la zona franca',
    });

    try {
      await enviarReporte(payload);
      hideLoading();
      showToast({ title: 'Reporte enviado con éxito 🌟', type: 'ok' });
      form.reset();
    } catch (err) {
      hideLoading();
      showFriendlyError({
        title: 'No pudimos enviar tu reporte 💔',
        message:
          'Parece que el servidor de datos no está disponible. Verifica que json-server esté corriendo en http://localhost:3001 e inténtalo de nuevo.',
        code: err.status ? String(err.status) : 'CONEXIÓN',
        icon: '📡',
      });
    }
  });
}

init();