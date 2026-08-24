/* ============================================================
   FranCat CR — Módulo 2 · js/js/detalle.js
   Lógica de la página "Detalle de Solicitud" (RF-04 / RF-05 / RF-12)
   - Lee ?id= de la URL y carga la solicitud desde json-server.
   - Resuelve empresa y zona franca (por id o por nombre).
   - Ejecuta el motor IA (ia-engine.js) cuando la zona tiene
     criterios; de lo contrario usa un score suavizado y avisa.
   - RF-12: confirmar / modificar / resetear clasificación IA.
   - Renderiza historial de la solicitud y de la empresa.
   ============================================================ */

import {
  solicitudesService,
  empresasService,
  zonasFrancasService,
} from '#apiService';
import { evaluarSolicitud, clasificarPorPuntaje } from '#iaEngine';

const API_BASE = 'http://localhost:3001';

/* ---------- Estado ---------- */
let solicitud = null;
let empresa = null;
let zona = null;
let clasificacionActual = null;

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const loading = $('loadingOverlay');
const messageArea = $('messageArea');

/* ---------- Utilidades de UI ---------- */
function mostrarMensaje(texto, tipo = 'success') {
  messageArea.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning');
  messageArea.classList.add('alert-' + tipo);
  messageArea.textContent = texto;
}

function setLoading(on) {
  loading.classList.toggle('show', on);
}

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function badgeClasificacion(clasif) {
  const map = { Recomendada: 'success', Revisar: 'warning', Rechazada: 'danger' };
  const el = document.getElementById('iaClasificacion');
  el.className = 'badge ' + (map[clasif] || 'secondary') + ' badge-estado';
  el.textContent = clasif;
  el.style.fontSize = '0.9rem';
}

/* ---------- Normalizar datos para el motor IA ---------- */
function proyectarParaIA(s) {
  return {
    sector: s.sector || '',
    inversionProyectada: Number(s.inversionProyectada ?? s.inversionAnual ?? s.inversionAnualR ?? s.inversionUSD ?? 0),
    empleosProyectados: Number(s.empleosProyectados ?? s.empleosMeta ?? s.empleosAnual ?? s.empleosGenerados ?? 0),
  };
}

/* ---------- Score simplificado (sin criterios de zona) ---------- */
function scoreSimplificado(s) {
  const inversion = Number(s.inversionAnual ?? s.inversionAnualR ?? 0);
  const empleos = Number(s.empleosMeta ?? s.empleosAnual ?? 0);

  const puntajeSector = s.sector ? 40 : 0;
  const puntajeInversion = Math.min(30, Math.round((inversion / 300000) * 30));
  const puntajeEmpleos = Math.min(30, Math.round((empleos / 100) * 30));
  const total = Math.min(100, puntajeSector + puntajeInversion + puntajeEmpleos);

  const justificacion =
    'Evaluación con parámetros generales (la zona franca no define criterios detallados). ' +
    'Puntaje sector: ' + puntajeSector + '/40, Inversión: ' + puntajeInversion + '/30, Empleos: ' + puntajeEmpleos + '/30. ' +
    (total >= 75
      ? 'La solicitud cumple sobradamente los umbrales mínimos.'
      : total >= 50
        ? 'La solicitud requiere análisis adicional.'
        : 'La solicitud no alcanza los umbrales mínimos.');

  return {
    puntaje: total,
    clasificacion: clasificarPorPuntaje(total),
    justificacion,
    detalle: { puntajeSector, puntajeInversion, puntajeEmpleos },
  };
}

/* ---------- Renderizado de la evaluación IA ---------- */
function renderResultadoIA(evaluacion) {
  document.getElementById('iaResultado').style.display = 'none';
  document.getElementById('iaResultadoContenido').style.display = '';

  document.getElementById('iaPuntaje').textContent = evaluacion.puntaje;
  const det = evaluacion.detalle || {};
  document.getElementById('iaJustificacion').textContent = evaluacion.justificacion || '';
  document.getElementById('iaPuntajeSector').textContent = det.puntajeSector ?? 0;
  document.getElementById('iaPuntajeInversion').textContent = det.puntajeInversion ?? 0;
  document.getElementById('iaPuntajeEmpleos').textContent = det.puntajeEmpleos ?? 0;

  clasificacionActual = evaluacion.clasificacion;
  badgeClasificacion(clasificacionActual);
}

/* ---------- Evaluación IA ---------- */
async function evaluarIA() {
  setLoading(true);
  try {
    let evaluacion;
    const criterios = zona && zona.criterios;

    if (criterios && Array.isArray(criterios.sectoresPermitidos)) {
      const zonaParaIA = {
        criterios: {
          sectoresPermitidos: criterios.sectoresPermitidos,
          inversionMinima: Number(criterios.inversionMinima) || 0,
          empleosMinimos: Number(criterios.empleosMinimos) || 0,
        },
      };
      evaluacion = await evaluarSolicitud(proyectarParaIA(solicitud), zonaParaIA);
    } else {
      evaluacion = scoreSimplificado(solicitud);
    }

    renderResultadoIA(evaluacion);
    mostrarMensaje('Evaluación IA completada ✅', 'success');
  } catch (error) {
    console.error('[detalle] Error en evaluación IA:', error);
    mostrarMensaje('No se pudo completar la evaluación con IA. Revisa la consola.', 'danger');
  } finally {
    setLoading(false);
  }
}
/* ---------- RF-12: Acciones sobre la clasificación ---------- */
async function guardarDecision(payloadExtra) {
  try {
    const res = await fetch(`${API_BASE}/solicitudes/${solicitud.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadExtra),
    });
    if (!res.ok) throw new Error('status ' + res.status);
    const actualizada = await res.json();
    solicitud = Object.assign({}, solicitud, actualizada);
    return true;
  } catch (err) {
    console.error('[detalle] No se pudo guardar la decisión:', err);
    mostrarMensaje('No se pudo guardar la decisión en el servidor.', 'danger');
    return false;
  }
}

function bindAccionesRF12() {
  const confirmarBtn = $('confirmarClasificacionBtn');
  const resetearBtn = $('resetearIABtn');

  if (confirmarBtn) {
    confirmarBtn.addEventListener('click', async () => {
      if (!clasificacionActual) return;
      const tipoEstado =
        clasificacionActual === 'Recomendada' ? 'Aprobada' :
        clasificacionActual === 'Rechazada' ? 'Rechazada' :
        solicitud.estado || 'En Revisión';
      const ok = await guardarDecision({ decision: clasificacionActual, estado: tipoEstado });
      if (ok) {
        mostrarMensaje(`Clasificación confirmada: ${clasificacionActual} ✅`, 'success');
        if ($('solicitudEstadoBadge')) {
          $('solicitudEstadoBadge').textContent = tipoEstado;
          $('solicitudEstadoBadge').className = `badge ${tipoEstado === 'Aprobada' ? 'bg-success' : tipoEstado === 'Rechazada' ? 'bg-danger' : 'bg-warning text-dark'} badge-estado`;
        }
      }
    });
  }

  document.querySelectorAll('.dropdown-item[data-clasif]').forEach((item) => {
    item.addEventListener('click', async () => {
      const nueva = item.dataset.clasif;
      clasificacionActual = nueva;
      badgeClasificacion(nueva);
      const ok = await guardarDecision({ decision: nueva });
      if (ok) mostrarMensaje(`Clasificación modificada a: ${nueva} ✍️`, 'success');
    });
  });

  if (resetearBtn) {
    resetearBtn.addEventListener('click', async () => {
      const ok = await guardarDecision({ decision: null, scoreIA: null });
      clasificacionActual = null;
      if (ok) {
        $('iaResultado').style.display = '';
        $('iaResultadoContenido').style.display = 'none';
        mostrarMensaje('Evaluación IA reiniciada. Puedes volver a evaluar.', 'info');
      }
    });
  }

  const evaluarBtn = $('evaluarBtn');
  if (evaluarBtn) evaluarBtn.addEventListener('click', evaluarIA);
}

/* ---------- Render del detalle ---------- */
function renderDetalle() {
  const empresaTexto = solicitud.empresa || (empresa && empresa.razonSocial) || '—';
  const nit = (empresa && empresa.nit) || solicitud.nit || '—';
  const zonaTexto = solicitud.zonaFranca || (zona && zona.nombre) || '—';
  const ciudad = (zona && zona.ubicacion && zona.ubicacion.ciudad) || solicitud.zonaCiudad || '—';

  $('solicitudIdDisplay').textContent = `#${solicitud.id}`;
  $('solicitudId').textContent = solicitud.id;
  $('solicitudTipo').textContent = solicitud.tipoSolicitud || solicitud.tipo || 'Admisión';
  $('solicitudFecha').textContent = solicitud.fechaPresentacion || solicitud.fechaSolicitud || '—';
  $('empresaNombre').textContent = empresaTexto;
  $('empresaNit').textContent = nit;
  $('solicitudSector').textContent = solicitud.sector || '—';
  $('solicitudInversion').textContent = fmt(solicitud.inversionProyectada ?? solicitud.inversionAnual ?? solicitud.inversionAnualR ?? 0);
  $('solicitudEmpleos').textContent = fmt(solicitud.empleosProyectados ?? solicitud.empleosMeta ?? solicitud.empleosAnual ?? 0);
  $('zonaNombre').textContent = zonaTexto;
  $('zonaCiudad').textContent = ciudad;
  $('solicitudDescripcion').textContent = solicitud.descripcion || 'Sin descripción.';

  const estadoBadge = $('solicitudEstadoBadge');
  const claseEstado =
    solicitud.estado === 'Aprobada' ? 'bg-success' :
    solicitud.estado === 'Rechazada' ? 'bg-danger' :
    solicitud.estado === 'En Revisión' ? 'bg-warning text-dark' : 'bg-secondary';
  estadoBadge.className = `badge ${claseEstado} badge-estado`;
  estadoBadge.textContent = solicitud.estado || '—';

  if (zona && zona.criterios) {
    $('zonaSectores').textContent = (zona.criterios.sectoresPermitidos || []).join(', ') || 'Sin definir';
    $('zonaInvMin').textContent = fmt(zona.criterios.inversionMinima || 0);
    $('zonaEmpMin').textContent = fmt(zona.criterios.empleosMinimos || 0);
  } else {
    $('zonaSectores').textContent = '—';
    $('zonaInvMin').textContent = '—';
    $('zonaEmpMin').textContent = '—';
  }

  renderTrazabilidad();
  renderHistorialEmpresa();

  if (solicitud.scoreIA != null || solicitud.decision != null) {
    const ev = scoreSimplificado(solicitud);
    ev.puntaje = solicitud.scoreIA ?? ev.puntaje;
    ev.clasificacion = solicitud.decision || ev.clasificacion;
    if (solicitud.decision) clasificacionActual = solicitud.decision;
    renderResultadoIA(ev);
  }
}
/* ---------- Trazabilidad de la solicitud y ficha de empresa ---------- */
function renderTrazabilidad() {
  const cont = $('trazabilidadContenido');
  const historial = solicitud.historial || [];
  if (historial.length === 0) {
    cont.innerHTML = '<p class="text-muted">No hay acciones registradas.</p>';
    return;
  }
  cont.innerHTML = historial
    .map(
      (h) => `
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <strong>${h.tipo || 'evento'}</strong>
            <div class="text-muted small">${h.descripcion || ''}</div>
          </div>
          <span class="badge bg-light text-dark">${h.fecha || '—'} · ${h.estado || ''}</span>
        </div>`
    )
    .join('<hr class="my-1" />');
}

function renderHistorialEmpresa() {
  const cont = $('historialEmpresa');
  if (!empresa) {
    cont.innerHTML =
      '<p class="text-muted">Empresa sin ficha ampliada en el registro de `empresas`. ' +
      'Los datos provienen directamente de la solicitud.</p>';
    return;
  }
  cont.innerHTML = `
    <ul class="list-unstyled small mb-0">
      <li><strong>Razón social:</strong> ${empresa.razonSocial}</li>
      <li><strong>NIT:</strong> ${empresa.nit}</li>
      <li><strong>Representante:</strong> ${empresa.representanteLegal || '—'}</li>
      <li><strong>Sector económico:</strong> ${empresa.sectorEconomico || '—'}</li>
      <li><strong>Estado:</strong> ${empresa.estado || '—'}</li>
      <li><strong>Admisión:</strong> ${empresa.fechaAdmision || '—'}</li>
      <li><strong>Contacto:</strong> ${empresa.email || '—'} ${empresa.telefono ? '· ' + empresa.telefono : ''}</li>
    </ul>`;
}

/* ---------- Carga inicial ---------- */
async function cargarDatos() {
  setLoading(true);
  try {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
      mostrarMensaje('Falta el parámetro ?id= en la URL.', 'warning');
      return;
    }

    // Cargar en paralelo la solicitud + catálogos complementarios
    const [sol, emps, zonas] = await Promise.all([
      solicitudesService.getById(id),
      empresasService.getAll().catch(() => []),
      zonasFrancasService.getAll().catch(() => []),
    ]);

    solicitud = sol;
    if (!solicitud) {
      mostrarMensaje(`No existe la solicitud #${id} en el servidor.`, 'danger');
      return;
    }

    // Resolver empresa: por empresaId o por nombre
    if (solicitud.empresaId != null) {
      empresa = emps.find((e) => Number(e.id) === Number(solicitud.empresaId)) || null;
    } else if (solicitud.empresa) {
      empresa = emps.find(
        (e) => String(e.razonSocial).toLowerCase() === String(solicitud.empresa).toLowerCase()
      ) || null;
    }

    // Resolver zona: por zonaFrancaId o por nombre
    if (solicitud.zonaFrancaId != null) {
      zona = zonas.find((z) => Number(z.id) === Number(solicitud.zonaFrancaId)) || null;
    } else if (solicitud.zonaFranca) {
      zona = zonas.find(
        (z) => String(z.nombre).toLowerCase() === String(solicitud.zonaFranca).toLowerCase()
      ) || null;
    }

    renderDetalle();
    bindAccionesRF12();
  } catch (err) {
    console.error('[detalle] No se pudieron cargar los datos:', err);
    mostrarMensaje(
      'No pudimos cargar el detalle. Verifica que json-server esté corriendo en http://localhost:3001.',
      'danger'
    );
  } finally {
    setLoading(false);
  }
}

cargarDatos();
