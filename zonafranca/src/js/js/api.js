const API_BASE_URL = 'http://localhost:3001';

// ------------------------------------------------------------
// Cliente HTTP genérico con manejo central de errores
// ------------------------------------------------------------
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch (_) {}
      throw new Error(`Error ${response.status}: ${response.statusText} - ${errorBody}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    console.error(`[API Client] Falló la petición a ${endpoint}:`, error.message);
    throw error;
  }
}

// ------------------------------------------------------------
// Servicio: Zonas Francas
// ------------------------------------------------------------
export const zonasFrancasService = {
  async getAll() {
    try {
      return await apiFetch('/zonasFrancas');
    } catch (error) {
      console.error('[zonasFrancasService] getAll falló:', error);
      throw error;
    }
  },
  async getById(id) {
    try {
      return await apiFetch(`/zonasFrancas/${id}`);
    } catch (error) {
      console.error(`[zonasFrancasService] getById(${id}) falló:`, error);
      throw error;
    }
  },
  async create(data) {
    try {
      return await apiFetch('/zonasFrancas', { method: 'POST', body: JSON.stringify(data) });
    } catch (error) {
      console.error('[zonasFrancasService] create falló:', error);
      throw error;
    }
  },
};

// ------------------------------------------------------------
// Servicio: Empresas
// ------------------------------------------------------------
export const empresasService = {
  async getAll() {
    try {
      return await apiFetch('/empresas');
    } catch (error) {
      console.error('[empresasService] getAll falló:', error);
      throw error;
    }
  },
  async getById(id) {
    try {
      return await apiFetch(`/empresas/${id}`);
    } catch (error) {
      console.error(`[empresasService] getById(${id}) falló:`, error);
      throw error;
    }
  },
  async create(data) {
    try {
      return await apiFetch('/empresas', { method: 'POST', body: JSON.stringify(data) });
    } catch (error) {
      console.error('[empresasService] create falló:', error);
      throw error;
    }
  },
};

// ------------------------------------------------------------
// Servicio: Solicitudes
// ------------------------------------------------------------
export const solicitudesService = {
  async getAll() {
    try {
      return await apiFetch('/solicitudes');
    } catch (error) {
      console.error('[solicitudesService] getAll falló:', error);
      throw error;
    }
  },
  async getById(id) {
    try {
      return await apiFetch(`/solicitudes/${id}`);
    } catch (error) {
      console.error(`[solicitudesService] getById(${id}) falló:`, error);
      throw error;
    }
  },
  async create(data) {
    try {
      return await apiFetch('/solicitudes', { method: 'POST', body: JSON.stringify(data) });
    } catch (error) {
      console.error('[solicitudesService] create falló:', error);
      throw error;
    }
  },
};

// ------------------------------------------------------------
// Servicio: Reportes de Cumplimiento
// ------------------------------------------------------------
export const reportesCumplimientoService = {
  async getAll() {
    try {
      return await apiFetch('/reportesCumplimiento');
    } catch (error) {
      console.error('[reportesCumplimientoService] getAll falló:', error);
      throw error;
    }
  },
  async getById(id) {
    try {
      return await apiFetch(`/reportesCumplimiento/${id}`);
    } catch (error) {
      console.error(`[reportesCumplimientoService] getById(${id}) falló:`, error);
      throw error;
    }
  },
  async create(data) {
    try {
      return await apiFetch('/reportesCumplimiento', { method: 'POST', body: JSON.stringify(data) });
    } catch (error) {
      console.error('[reportesCumplimientoService] create falló:', error);
      throw error;
    }
  },
};