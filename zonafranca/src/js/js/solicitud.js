// src/js/pages/solicitud.js
import {
  empresasService,
  zonasFrancasService,
  solicitudesService,
} from './api.js';

// ------------------------------------------------------------
// Referencias a elementos del DOM
// ------------------------------------------------------------
const form = document.getElementById('solicitudForm');
const empresaSelect = document.getElementById('empresaId');
const zonaSelect = document.getElementById('zonaFrancaId');
const tipoSelect = document.getElementById('tipoSolicitud');
const fechaInput = document.getElementById('fechaPresentacion');
const descripcionTextarea = document.getElementById('descripcion');
const messageArea = document.getElementById('messageArea');
const btnEnviar = document.getElementById('btnEnviar');

// ------------------------------------------------------------
// Utilidades de UI
// ------------------------------------------------------------
function mostrarMensaje(mensaje, tipo = 'success') {
  messageArea.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning');
  messageArea.classList.add(`alert-${tipo}`);
  messageArea.textContent = mensaje;
}

function ocultarMensaje() {
  messageArea.classList.add('d-none');
  messageArea.textContent = '';
}

function setLoading(loading) {
  if (loading) {
    btnEnviar.classList.add('form-loading');
    btnEnviar.disabled = true;
  } else {
    btnEnviar.classList.remove('form-loading');
    btnEnviar.disabled = false;
  }
}

function setFormError(element) {
  element.classList.add('is-invalid');
}

function clearFormErrors() {
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

// ------------------------------------------------------------
// 1. Cargar opciones de Empresas y Zonas Francas (GET)
// ------------------------------------------------------------
async function cargarDropdowns() {
  try {
    // Cargar empresas
    const empresas = await empresasService.getAll();
    empresaSelect.innerHTML = '<option value="">-- Selecciona una empresa --</option>';
    empresas.forEach(emp => {
      const option = document.createElement('option');
      option.value = emp.id;
      option.textContent = `${emp.razonSocial} (NIT: ${emp.nit})`;
      empresaSelect.appendChild(option);
    });

    // Cargar zonas francas
    const zonas = await zonasFrancasService.getAll();
    zonaSelect.innerHTML = '<option value="">-- Selecciona una zona franca --</option>';
    zonas.forEach(zona => {
      const option = document.createElement('option');
      option.value = zona.id;
      option.textContent = `${zona.nombre} - ${zona.ubicacion.ciudad}`;
      zonaSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error cargando dropdowns:', error);
    mostrarMensaje('Error al cargar los datos del servidor. Asegúrate de que json-server esté corriendo.', 'danger');
  }
}

// ------------------------------------------------------------
// 2. Establecer fecha actual por defecto
// ------------------------------------------------------------
function setDefaultDate() {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  fechaInput.value = `${year}-${month}-${day}`;
}

// ------------------------------------------------------------
// 3. Manejar el envío del formulario (POST)
// ------------------------------------------------------------
async function handleSubmit(event) {
  event.preventDefault();
  ocultarMensaje();
  clearFormErrors();

  // Validar campos requeridos
  let isValid = true;
  if (!empresaSelect.value) {
    setFormError(empresaSelect);
    isValid = false;
  }
  if (!zonaSelect.value) {
    setFormError(zonaSelect);
    isValid = false;
  }
  if (!tipoSelect.value) {
    setFormError(tipoSelect);
    isValid = false;
  }
  if (!fechaInput.value) {
    setFormError(fechaInput);
    isValid = false;
  }

  if (!isValid) {
    mostrarMensaje('Por favor completa todos los campos obligatorios.', 'warning');
    return;
  }

  // Construir el payload según la estructura de "solicitudes"
  const payload = {
    empresaId: Number(empresaSelect.value),
    zonaFrancaId: Number(zonaSelect.value),
    tipoSolicitud: tipoSelect.value,
    fechaPresentacion: fechaInput.value,
    estado: 'Pendiente', // Estado inicial por defecto
    descripcion: descripcionTextarea.value.trim() || 'Sin descripción adicional',
    numeroResolucion: null, // Se asignará luego en la gestión administrativa
  };

  try {
    setLoading(true);
    const nuevaSolicitud = await solicitudesService.create(payload);
    console.log('Solicitud creada:', nuevaSolicitud);

    mostrarMensaje(`✅ ¡Solicitud #${nuevaSolicitud.id} creada exitosamente!`, 'success');

    // Resetear el formulario (manteniendo los dropdowns cargados y la fecha actual)
    form.reset();
    setDefaultDate();
    // Limpiar validaciones
    clearFormErrors();
    // Opcional: recargar dropdowns para reflejar cambios (si el servidor actualiza algo)
    // cargarDropdowns(); 
  } catch (error) {
    console.error('Error al enviar la solicitud:', error);
    mostrarMensaje(`❌ Error al crear la solicitud: ${error.message || 'Intenta de nuevo más tarde.'}`, 'danger');
  } finally {
    setLoading(false);
  }
}

// ------------------------------------------------------------
// 4. Inicialización de la página
// ------------------------------------------------------------
async function init() {
  // Mostrar estado de carga en los selects (opcional)
  empresaSelect.innerHTML = '<option value="">Cargando empresas...</option>';
  zonaSelect.innerHTML = '<option value="">Cargando zonas...</option>';

  await cargarDropdowns();
  setDefaultDate();

  // Asignar eventos
  form.addEventListener('submit', handleSubmit);

  // Botón limpiar: resetear y ocultar mensajes
  document.getElementById('btnLimpiar').addEventListener('click', () => {
    form.reset();
    ocultarMensaje();
    clearFormErrors();
    setDefaultDate();
  });
}

// Ejecutar cuando el DOM esté listo (el módulo se carga al final del HTML)
init();