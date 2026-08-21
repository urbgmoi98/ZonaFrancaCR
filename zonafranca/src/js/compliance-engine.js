/* ============================================================
   FranCat CR — Módulo 2 · compliance-engine.js
   Motor de cumplimiento y alertas (RF-07 / RF-08)
   ------------------------------------------------------------
   Compara valores reportados vs. compromisos originales
   obtenidos de json-server en http://localhost:3001
   (collection: reportesCumplimiento + solicitudes)

   Reglas de negocio implementadas (del levantamiento):
   RC-01  Desviación inversión < 10%        → Sin alerta (En Regla)
   RC-02  Desviación inversión 10% – 25%    → Alerta amarilla
   RC-03  Desviación inversión > 25%        → Alerta roja
            (o 2 trimestres consecutivos con > 10%)
   RC-04  Empleos < 90% de la meta          → Alerta amarilla
   RC-05  Empleos < 75% en 2 trimestres      → Alerta roja
   RC-06  Reporte extemporáneo (después día 15) → Alerta amarilla
   RC-07  Reporte no recibido (después día 25)  → Alerta roja
   ============================================================ */

const API_BASE = 'http://localhost:3001';

/* ---------- Helpers internos ---------- */
function deviationPercent(comprometido, real) {
  const c = Number(comprometido) || 0;
  const r = Number(real) || 0;
  if (c === 0) return r === 0 ? 0 : 100; // sin compromiso: reportar es desviación total
  return ((r - c) / c) * 100;
}

function isLate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.getDate() > 15;
}

/* ---------- Fetch con manejo de errores amigable ---------- */
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error('El servidor respondió con estado ' + res.status);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/* ---------- Cálculo de alerta para un reporte ---------- */
export function evaluateReporte(reporte, solicitud) {
  // Compromisos originales (anualizados → trimestralización simple)
  const inversionComprometida =
    Number(solicitud.inversionAnual) / 4 || 0;
  const empleosMeta = Number(solicitud.empleosAnual) || Number(solicitud.empleosMeta) || 0;

  const inversionReal = Number(reporte.inversionReal) || 0;
  const empleosReal = Number(reporte.empleosReal) || 0;
  const exportacionesReal = Number(reporte.exportacionesReal) || 0;

  const devInversion = deviationPercent(inversionComprometida, inversionReal);
  const pctEmpleos = empleosMeta > 0 ? (empleosReal / empleosMeta) * 100 : 0;

  // Mensajes por regla activa
  const messages = [];
  let severidad = 'ok'; // green
  let codigo = 'RC-01';

  // RC-01 / RC-02 / RC-03 — Inversión
  const absDevInv = Math.abs(devInversion);
  if (absDevInv < 10) {
    messages.push('Inversión dentro del margen (<10%). ✓ RC-01');
  } else if (absDevInv <= 25) {
    severidad = 'amarilla';
    codigo = 'RC-02';
    messages.push(
      `Desviación de inversión ${devInversion.toFixed(1)}% (10%–25%). Alerta amarilla + recordatorio. RC-02`
    );
  } else {
    severidad = 'roja';
    codigo = 'RC-03';
    messages.push(
      `Desviación de inversión ${devInversion.toFixed(1)}% (>25%). Alerta roja + plan de acción correctiva y notificación a PROCOMER. RC-03`
    );
  }

  // RC-04 / RC-05 — Empleo
  if (pctEmpleos >= 90) {
    messages.push('Empleos dentro de meta (≥90%). ✓ RC-04');
  } else if (pctEmpleos >= 75) {
    if (severidad !== 'amarilla' && severidad !== 'roja') {
      severidad = 'amarilla';
      codigo = 'RC-04';
    }
    messages.push(
      `Empleos al ${pctEmpleos.toFixed(1)}% de la meta (<90%). Alerta amarilla al analista. RC-04`
    );
  } else {
    if (severidad !== 'roja') {
      severidad = 'roja';
      codigo = 'RC-05';
    }
    messages.push(
      `Empleos críticos: ${pctEmpleos.toFixed(1)}% de la meta (<75%). Alerta roja + convocatoria a reunión con el Director. RC-05`
    );
  }

  // RC-06 / RC-07 — Reporte
  if (!reporte.recibido) {
    severidad = 'roja';
    codigo = 'RC-07';
    messages.push('Reporte no recibido después del día 25 post-trimestre. Alerta roja + notificación formal a PROCOMER. RC-07');
  } else if (isLate(reporte.fechaEnvio) && severidad !== 'roja') {
    severidad = 'amarilla';
    codigo = 'RC-06';
    messages.push('Reporte enviado después del día 15. Alerta amarilla + registro de morosidad. RC-06');
  }

  return {
    reporteId: reporte.id,
    empresaId: Number(reporte.empresaId) || Number(solicitud.id),
    empresa: reporte.empresa || solicitud.empresa,
    periodo: reporte.periodo,
    trimestre: reporte.trimestre,
    ano: reporte.ano,
    nivel: severidad,
    codigo,
    inversionComprometida: inversionComprometida,
    inversionReal,
    devInversion,
    empleosMeta,
    empleosReal,
    pctEmpleos,
    exportaciones: exportacionesReal,
    fechaEnvio: reporte.fechaEnvio,
    recibido: !!reporte.recibido,
    mensajes,
    accion: accionRecomendada(severidad),
  };
}

function accionRecomendada(nivel) {
  if (nivel === 'roja') return 'Activar plan de acción correctiva y notificar a PROCOMER 🚨';
  if (nivel === 'amarilla') return 'Enviar recordatorio y convocar reunión de seguimiento ⚠️';
  return 'Sin acciones requeridas. Empresa en regla ✅';
}

/* ---------- Consulta y evaluación de TODOS los reportes ---------- */
export async function obtenerReportesYCumplimiento() {
  const [reportes, solicitudes] = await Promise.all([
    fetchJson(`${API_BASE}/reportesCumplimiento`),
    fetchJson(`${API_BASE}/solicitudes`),
  ]);
  return buildResultados(reportes, solicitudes);
}

/* ---------- Exportar para la página de alertas ---------- */
export function buildResultados(reportes, solicitudes) {
  const solicitudPorId = new Map(
    (solicitudes || []).map((s) => [Number(s.id), s])
  );

  const resultados = (reportes || []).map((r) => {
    const solic = solicitudPorId.get(Number(r.empresaId)) || {};
    return evaluateReporte(r, solic);
  });

  const activas = resultados.filter((r) => r.nivel !== 'ok');
  return { resultados, activas };
}

/* ---------- Conteo rápido de alertas para el dashboard ---------- */
export function resumenAlertas(resultados) {
  const total = resultados.length;
  const rojas = resultados.filter((r) => r.nivel === 'roja').length;
  const amarillas = resultados.filter((r) => r.nivel === 'amarilla').length;
  const enRegla = total - rojas - amarillas;
  return { total, rojas, amarillas, enRegla };
}

/* ---------- Export PROCOMER (simulado, RF-09) ---------- */
export function buildProcomerExport(resultados) {
  const lines = [];
  lines.push('REPORTE TRIMESTRAL DE ALERTAS — PROCOMER (SIMULACIÓN)');
  lines.push('Generado: ' + new Date().toLocaleString('es-CR'));
  lines.push('========================================================');
  lines.push('');
  for (const r of resultados) {
    lines.push(`• ${r.empresa}`);
    lines.push(`  Período : ${r.periodo}  Nivel: ${r.nivel.toUpperCase()}`);
    lines.push(`  Inversión comprometida : $${Math.round(r.inversionComprometida).toLocaleString('en-US')}`);
    lines.push(`  Inversión real         : $${Math.round(r.inversionReal).toLocaleString('en-US')}`);
    lines.push(`  Empleos meta / real    : ${r.empleosMeta} / ${r.empleosReal}  (${r.pctEmpleos.toFixed(1)}%)`);
    lines.push(`  Exportaciones          : $${Math.round(r.exportaciones).toLocaleString('en-US')}`);
    lines.push(`  Regla                   : ${r.codigo}`);
    lines.push('');
  }
  return lines.join('\n');
}

/* ---------- Descarga del archivo PROCOMER ---------- */
export function downloadProcomerExport(resultados, filename = 'alertas_procomer.txt') {
  const content = buildProcomerExport(resultados);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}