/* ============================================================
   FranCat CR — Módulo 2 · pages/alertas.js
   Panel de alertas de cumplimiento (RF-08 / RF-09)
   ------------------------------------------------------------
   - Carga reportes y solicitudes desde json-server (:3001)
   - Evalúa con compliance-engine (RC-01..RC-07)
   - Renderiza paneles con bordes brillantes (#E63946) y pills
   - Filtros por nivel (todas / rojas / amarillas / en regla)
   - Exportación PROCOMER simulada (descarga .txt)
   ============================================================ */

import {
  showLoading,
  hideLoading,
  showFriendlyError,
  showToast,
  initSparkles,
  initFloatingEmojis,
  esc,
  formatCurrency,
  formatNumber,
  formatDate,
} from '../js/ui-helpers.js';
import {
  obtenerReportesYCumplimiento,
  buildProcomerExport,
  downloadProcomerExport,
  resumenAlertas,
} from '../js/compliance-engine.js';

/* ---------- Estado ---------- */
let resultados = [];
let filtroActual = 'todas';

/* ---------- Render de un panel de alerta ---------- */
function panelHTML(r) {
  const nivelClass =
    r.nivel === 'roja' ? 'roja' : r.nivel === 'amarilla' ? 'amarilla' : 'ok';
  const pillClass =
    r.nivel === 'roja' ? 'pill-red' : r.nivel === 'amarilla' ? 'pill-yellow' : 'pill-green';
  const pillText =
    r.nivel === 'roja' ? '🔴 Alerta Roja' : r.nivel === 'amarilla' ? '🟡 Alerta Amarilla' : '🟢 En Regla';

  const mensajes = (r.mensajes || [])
    .map((m) => `<li>${esc(m)}</li>`)
    .join('');

  return `
    <article class="alert-panel ${nivelClass}">
      <div class="alert-head">
        <h3>${esc(r.empresa)}</h3>
        <span class="pill ${pillClass}">${pillText}</span>
      </div>
      <div class="alert-empresa">Período ${esc(r.periodo)} · Regla ${esc(r.codigo)}</div>

      <div class="metric-break">
        <div class="row"><span>Inversión comprometida</span><b>${formatCurrency(r.inversionComprometida)}</b></div>
        <div class="row"><span>Inversión real</span><b>${formatCurrency(r.inversionReal)}</b></div>
        <div class="row"><span>Desviación inversión</span><b>${r.devInversion.toFixed(1)}%</b></div>
        <div class="row"><span>Empleos meta / real</span><b>${formatNumber(r.empleosMeta)} / ${formatNumber(r.empleosReal)}</b></div>
        <div class="row"><span>% empleos</span><b>${r.pctEmpleos.toFixed(1)}%</b></div>
        <div class="row"><span>Exportaciones</span><b>${formatCurrency(r.exportaciones)}</b></div>
        <div class="row"><span>Fecha envío</span><b>${formatDate(r.fechaEnvio)}</b></div>
      </div>

      <ul class="alert-messages">${mensajes}</ul>

      <div class="alerta-actions">
        <button class="pixel-btn soft" data-export-one="${r.reporteId}">📤 Exportar PROCOMER</button>
        <button class="pixel-btn ${r.nivel === 'roja' ? '' : 'green'}" data-ver-detalle="${r.reporteId}">🔍 Ver detalle</button>
      </div>
    </article>
  `;
}

/* ---------- Render del grid ---------- */
function renderAlertas() {
  const grid = document.getElementById('alertasGrid');
  if (!grid) return;

  const filtradas =
    filtroActual === 'todas'
      ? resultados
      : resultados.filter((r) => r.nivel === filtroActual);

  if (filtradas.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        ✨ No hay alertas en esta categoría. ¡Todo en regla! ✨
      </div>
    `;
    return;
  }

  grid.innerHTML = filtradas.map(panelHTML).join('');
}

/* ---------- Actualizar contadores de la toolbar ---------- */
function renderContadores() {
  const resumen = resumenAlertas(resultados);
  const el = document.getElementById('contadores');
  if (!el) return;
  el.innerHTML = `
    <span class="filter-chip">Total: ${resumen.total}</span>
    <span class="filter-chip" style="border-color:var(--hot);color:var(--hot);">🔴 Rojas: ${resumen.rojas}</span>
    <span class="filter-chip" style="border-color:var(--yellow);color:var(--yellow);">🟡 Amarillas: ${resumen.amarillas}</span>
    <span class="filter-chip" style="border-color:var(--green);color:var(--green);">🟢 En regla: ${resumen.enRegla}</span>
  `;
}

/* ---------- Export PROCOMER (simulado) ---------- */
function exportarProcomer(reporteId) {
  const r = resultados.find((x) => x.reporteId === reporteId);
  if (!r) return;
  const contenido = buildProcomerExport([r]);
  showToast({ title: 'Export PROCOMER generado 📤', type: 'ok' });
  // Mostrar preview en modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="pixel-modal">
      <h3 class="modal-title">📤 Export PROCOMER — ${esc(r.empresa)}</h3>
      <pre class="procomer-preview">${esc(contenido)}</pre>
      <div class="modal-actions">
        <button class="pixel-btn soft" data-close-modal>Cerrar</button>
        <button class="pixel-btn" id="btnDescargar">⬇️ Descargar .txt</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#btnDescargar').addEventListener('click', () => {
    downloadProcomerExport([r], `procomer_${r.empresa.replace(/\s+/g, '_')}_${r.periodo}.txt`);
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  modal.querySelector('[data-close-modal]').addEventListener('click', () => modal.remove());
}

/* ---------- Ver detalle (modal) ---------- */
function verDetalle(reporteId) {
  const r = resultados.find((x) => x.reporteId === reporteId);
  if (!r) return;
  const mensajes = (r.mensajes || []).map((m) => `<li>${esc(m)}</li>`).join('');
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="pixel-modal">
      <h3 class="modal-title">🔍 Detalle — ${esc(r.empresa)}</h3>
      <div class="metric-break">
        <div class="row"><span>Período</span><b>${esc(r.periodo)}</b></div>
        <div class="row"><span>Nivel</span><b>${esc(r.nivel.toUpperCase())}</b></div>
        <div class="row"><span>Regla</span><b>${esc(r.codigo)}</b></div>
        <div class="row"><span>Inversión comprometida</span><b>${formatCurrency(r.inversionComprometida)}</b></div>
        <div class="row"><span>Inversión real</span><b>${formatCurrency(r.inversionReal)}</b></div>
        <div class="row"><span>Desviación</span><b>${r.devInversion.toFixed(1)}%</b></div>
        <div class="row"><span>Empleos meta / real</span><b>${formatNumber(r.empleosMeta)} / ${formatNumber(r.empleosReal)}</b></div>
        <div class="row"><span>% empleos</span><b>${r.pctEmpleos.toFixed(1)}%</b></div>
        <div class="row"><span>Exportaciones</span><b>${formatCurrency(r.exportaciones)}</b></div>
        <div class="row"><span>Fecha envío</span><b>${formatDate(r.fechaEnvio)}</b></div>
      </div>
      <ul class="alert-messages">${mensajes}</ul>
      <p class="text-muted">Acción recomendada: ${esc(r.accion)}</p>
      <div class="modal-actions">
        <button class="pixel-btn soft" data-close-modal>Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  modal.querySelector('[data-close-modal]').addEventListener('click', () => modal.remove());
}

/* ---------- Cargar datos ---------- */
async function cargarDatos() {
  showLoading({
    title: 'Cargando datos con IA... ✨',
    hint: 'evaluando cumplimiento trimestral',
  });
  try {
    const { resultados: res } = await obtenerReportesYCumplimiento();
    resultados = res;
    renderContadores();
    renderAlertas();
  } catch (err) {
    showFriendlyError({
      title: 'No pudimos cargar las alertas 💔',
      message:
        'El servidor de datos no está disponible. Verifica que json-server esté corriendo en http://localhost:3001.',
      code: err.status ? String(err.status) : 'CONEXIÓN',
      icon: '📡',
    });
  } finally {
    hideLoading();
  }
}

/* ---------- Inicialización ---------- */
function init() {
  initSparkles();
  initFloatingEmojis();

  // Filtros
  document.querySelectorAll('.filter-chip[data-filtro]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-filtro]').forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      filtroActual = chip.dataset.filtro;
      renderAlertas();
    });
  });

  // Delegación de eventos en el grid
  const grid = document.getElementById('alertasGrid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const exportBtn = e.target.closest('[data-export-one]');
      if (exportBtn) {
        exportProcomer(Number(exportBtn.dataset.exportOne));
        return;
      }
      const detalleBtn = e.target.closest('[data-ver-detalle]');
      if (detalleBtn) {
        verDetalle(Number(detalleBtn.dataset.verDetalle));
      }
    });
  }

  // Botón exportar todo
  const btnExportTodo = document.getElementById('exportarTodo');
  if (btnExportTodo) {
    btnExportTodo.addEventListener('click', () => {
      if (resultados.length === 0) {
        showToast({ title: 'No hay datos para exportar', type: 'error' });
        return;
      }
      downloadProcomerExport(resultados, 'alertas_procomer_consolidado.txt');
      showToast({ title: 'Consolidado PROCOMER descargado 📤', type: 'ok' });
    });
  }

  cargarDatos();
}

init();