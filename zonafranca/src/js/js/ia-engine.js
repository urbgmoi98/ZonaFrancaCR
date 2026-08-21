// src/js/ia-engine.js

/**
 * Motor de Inteligencia Artificial para Zonas Francas
 * Basado en el documento FranCatKM.pdf
 * 
 * RF-04: Puntaje de afinidad vía IA (0-100)
 * RF-05: Clasificación automática (Recomendada / Revisar / Rechazada)
 * RF-13: Evaluación en paralelo con Promise.all
 */

// ------------------------------------------------------------
// 1. Algoritmo de evaluación (Sector 40pts, Inversión 30pts, Empleos 30pts)
// ------------------------------------------------------------

/**
 * Evalúa una solicitud contra los criterios de una zona franca.
 * @param {Object} solicitud - Objeto con datos de la solicitud.
 * @param {Object} zonaFranca - Objeto con criterios de admisión.
 * @returns {Promise<Object>} Resultado con puntaje, justificación y clasificación.
 */
export async function evaluarSolicitud(solicitud, zonaFranca) {
  // Simular latencia de 800ms (RF-04: latencia simulada)
  await new Promise(resolve => setTimeout(resolve, 800));

  // Extraer datos necesarios
  const { sector, inversionProyectada, empleosProyectados } = solicitud;
  const { sectoresPermitidos, inversionMinima, empleosMinimos } = zonaFranca.criterios;

  // 1. Puntaje por sector (máx 40 pts)
  let puntajeSector = 0;
  if (sectoresPermitidos.includes(sector)) {
    puntajeSector = 40;
  }

  // 2. Puntaje por inversión (máx 30 pts)
  let puntajeInversion = 0;
  if (inversionProyectada >= inversionMinima) {
    // Escala lineal: si invierte el doble del mínimo, obtiene 30 pts
    const razon = inversionProyectada / inversionMinima;
    puntajeInversion = Math.min(razon, 2) * 15; // 15 pts por cada vez el mínimo (hasta 30)
  }

  // 3. Puntaje por empleos (máx 30 pts)
  let puntajeEmpleos = 0;
  if (empleosProyectados >= empleosMinimos) {
    const razon = empleosProyectados / empleosMinimos;
    puntajeEmpleos = Math.min(razon, 2) * 15; // similar
  }

  // Total (0-100)
  const total = Math.round(puntajeSector + puntajeInversion + puntajeEmpleos);

  // Clasificación según RF-05
  let clasificacion;
  let justificacion = `Puntaje sector: ${puntajeSector}/40, `;
  justificacion += `Inversión: ${puntajeInversion}/30, `;
  justificacion += `Empleos: ${puntajeEmpleos}/30. `;

  if (total >= 75) {
    clasificacion = 'Recomendada';
    justificacion += 'La solicitud cumple sobradamente con los criterios.';
  } else if (total >= 50) {
    clasificacion = 'Revisar';
    justificacion += 'La solicitud requiere análisis adicional.';
  } else {
    clasificacion = 'Rechazada';
    justificacion += 'La solicitud no alcanza los umbrales mínimos.';
  }

  return {
    puntaje: total,
    clasificacion,
    justificacion,
    detalle: {
      puntajeSector,
      puntajeInversion,
      puntajeEmpleos
    }
  };
}

// ------------------------------------------------------------
// 2. Evaluación en paralelo con Promise.all (RF-13)
// ------------------------------------------------------------

/**
 * Evalúa múltiples solicitudes en paralelo contra una misma zona franca.
 * @param {Array<Object>} solicitudes - Lista de solicitudes.
 * @param {Object} zonaFranca - Zona franca con criterios.
 * @returns {Promise<Array<Object>>} Lista de resultados con solicitud + evaluación.
 */
export async function evaluarMultiples(solicitudes, zonaFranca) {
  try {
    // Crear un array de promesas (cada una evalúa una solicitud)
    const promesas = solicitudes.map(solicitud =>
      evaluarSolicitud(solicitud, zonaFranca)
    );

    // Ejecutar todas en paralelo (Promise.all)
    const resultados = await Promise.all(promesas);

    // Combinar cada resultado con su solicitud original
    return solicitudes.map((solicitud, index) => ({
      solicitud,
      evaluacion: resultados[index]
    }));
  } catch (error) {
    console.error('[IA Engine] Error en evaluación paralela:', error);
    throw new Error('No se pudo completar la evaluación de todas las solicitudes.');
  }
}

// ------------------------------------------------------------
// 3. Función auxiliar: clasificación directa (para uso síncrono, si se necesita)
// ------------------------------------------------------------

/**
 * Clasifica una solicitud basándose en el puntaje (sin latencia).
 * Útil para pruebas o para re-clasificar sin llamar a la IA.
 */
export function clasificarPorPuntaje(puntaje) {
  if (puntaje >= 75) return 'Recomendada';
  if (puntaje >= 50) return 'Revisar';
  return 'Rechazada';
}

// ------------------------------------------------------------
// 4. (Opcional) Función que simula el envío a una API real
// ------------------------------------------------------------

/**
 * Versión que imita una llamada a una API externa.
 * En producción, aquí se haría fetch a un endpoint real.
 */
export async function evaluarConAPI(solicitud, zonaFranca) {
  // Simular llamada HTTP (podría ser fetch)
  // En este ejemplo, reutilizamos la función local
  return evaluarSolicitud(solicitud, zonaFranca);
}