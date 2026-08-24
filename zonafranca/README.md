# 🩷 FranCat CR — Sistema de Gestión de Zonas Francas

> **FranCat CR** (Franquicia de Zonas Francas de Costa Rica) es un sistema web para la **admisión y supervisión** de empresas dentro del régimen de Zona Franca. El proyecto se centra en el **Módulo 2**: captura de solicitudes, evaluación con puntaje de inteligencia artificial, reportes trimestrales de cumplimiento, generación de alertas y exportación consolidada a PROCOMER.

---

## 📑 Tabla de contenidos

1. [Descripción general](#-descripción-general)
2. [Tecnologías](#tecnologías)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Módulos y páginas](#módulos-y-páginas)
5. [Arquitectura y flujo](#arquitectura-y-flujo)
6. [Reglas de negocio](#reglas-de-negocio)
7. [Base de datos (json-server)](#base-de-datos-json-server)
8. [Cómo ejecutar el proyecto](#cómo-ejecutar-el-proyecto)
9. [Notas y consideraciones](#notas-y-consideraciones)

---

## Descripción general

El sistema **FranCat CR** permite gestionar el ciclo de vida completo de una empresa dentro de una zona franca en Costa Rica:

- **Admisión**: registro de solicitudes de ingreso, evaluación automática con puntuación IA y clasificación (Recomendada / Revisar / Rechazada).
- **Supervisión**: cada empresa aprobada presenta **reportes trimestrales de cumplimiento** con datos reales de inversión, empleos y exportaciones.
- **Cumplimiento**: un motor de reglas compara lo reportado contra los compromisos originales y genera **alertas** (verdes, amarillas o rojas).
- **Reporte externo**: se genera un consolidado que simula el envío a **PROCOMER** (Promotora del Comercio Exterior de Costa Rica).

La interfaz combina dos estilos visuales:

- **Estética Y2K / webcore "pixel"** con paleta rosa pastel (`webcore.css`) para Dashboard, Reporte y Alertas — ahora con **fondo hacker rosa neón dinámico**.
- **Bootstrap 5** tradicional para los formularios de Solicitud y Detalle.

---

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| **Vite 8** (`^8.2.0`) | Servidor de desarrollo, compilación y preview del proyecto web |
| **JavaScript (módulos ES)** | Lógica del frontend; imports relativos resueltos por Vite y empaquetados en el build |
| **json-server** | API REST simulada en `http://localhost:3001` con datos en `src/db.json` |
| **HTML5 / CSS3** | Maquetado y estilos (tema custom + Bootstrap 5.3) |
| **Bootstrap 5.3.2** | Componentes en los formularios (solicitud, detalle) |
| **Bootstrap Icons 1.11** | Iconografía |
| **CSS custom** | `webcore.css` — estética retro pixel Y2K |

> **Nota:** no hay backend propio; todo el "backend" se simula con **json-server**.

---

## Estructura del proyecto

El proyecto real se aloja en la subcarpeta **`zonafranca/`** dentro del directorio de trabajo.

```
zonafranca/
├── package.json              # Configuración del proyecto (Vite)
├── vite.config.js            # App multi-página (MPA): entradas de build + publicDir
├── .gitignore
├── index.html                # Dashboard de solicitudes de admisión (raíz "/")
├── reporte.html              # Formulario de reporte trimestral
├── alertas.html              # Panel de alertas de cumplimiento
├── solicitud.html            # Formulario de nueva solicitud (Bootstrap)
├── detalle-solicitud.html    # Detalle + evaluación IA de una solicitud
├── public/                   # Estáticos copiados tal cual (no procesados)
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── db.json                # Base de datos del json-server (colecciones)
    ├── assets/                # Imágenes/recursos (hero, svg)
    ├── css/
    │   └── webcore.css        # Tema visual Y2K pixel principal
    ├── js/                    # Módulos JavaScript
    │   ├── ui-helpers.js            # Helpers de UI (modales, loading, toasts)
    │   ├── compliance-engine.js     # Motor de cumplimiento y alertas (RC-01..RC-07)
    │   ├── neon-bg.js               # Fondo "hacker" de lluvia de código neón
    │   ├── js/
    │   │   ├── api.js               # Cliente HTTP genérico hacia json-server
    │   │   ├── ia-engine.js         # Motor de IA (score 0-100, clasificación)
    │   │   ├── solicitud.js         # Lógica del formulario de solicitud
    │   │   └── detalle.js           # Lógica del detalle de solicitud
    │   └── pages/
    │       └── reporte.js          # Lógica del formulario de reporte
    └── pages/
        └── alertas.js             # Lógica del panel de alertas
```

> **Nota:** en la raíz del directorio de trabajo también hay copias del `index.html` y de `node_modules`. La versión válida del proyecto es la contenida en `zonafranca/`.

---

## Módulos y páginas

### 1. Dashboard — Solicitudes de Zona Franca (`index.html`)
Permite visualizar las solicitudes de admisión de empresas en forma de tarjetas, con:

- **Métricas** (RF-18): total de solicitudes, porcentaje de aprobadas y tiempo medio de respuesta.
- **Filtros** (RF-15): búsqueda por nombre, estado, sector y zona franca.
- **Auditoría por empresa** (RF-14): modal con línea de tiempo trazable (solicitud → score IA → decisión del comité → evaluaciones trimestrales).

### 2. Formulario de Solicitud (`solicitud.html`) — Bootstrap
Captura una nueva solicitud de ingreso. Carga empresas, zonas francas y tipos de solicitud (Admisión, Beneficio Tributario, Ampliación, Exportación, Importación, Renovación) desde el servidor y hace `POST` a `/solicitudes`.

### 3. Detalle de Solicitud (`detalle-solicitud.html`) — Bootstrap
Muestra el detalle de una solicitud y la evaluación de IA:

- **Puntaje IA** (RF-04): puntaje 0-100 dividido en sector (40 pts), inversión (30 pts) y empleos (30 pts).
- **Clasificación** (RF-05): Recomendada / Revisar / Rechazada.
- **Acciones** (RF-12): confirmar clasificación, modificar manualmente o resetear IA.
- **Trazabilidad** e **historial de la empresa**.

### 4. Reporte Trimestral de Cumplimiento (`reporte.html`)
- Formulario (RF-06) en el que una empresa instalada declara período, inversión real, empleos reales, exportaciones, nómina, proveedores locales y fecha de envío.
- Al enviar, se hace `POST` a `/reportesCumplimiento` en json-server.
- Incluye la **Carta de Compromiso (RA-10)** y explica las reglas de alertas (RC-01..RC-07).

### 5. Panel de Alertas (`alertas.html`)
- Carga los reportes y solicitudes, los evalúa mediante `compliance-engine.js` y muestra tarjetas por nivel de alerta (roja / amarilla / en regla).
- Filtros por nivel, vista de detalle y **exportación PROCOMER** (descarga un archivo `.txt` de simulación).

### 6. Páginas auxiliares del proyecto base (plantilla Vite)
`src/main.js`, `src/counter.js`, `src/style.css`, `src/pages/i.html` y `ii.html` provienen de la plantilla inicial de Vite y no forman parte funcional de la lógica de negocio. → **Eliminados en la limpieza de duplicados.**

---

## Arquitectura y flujo

1. **Entrada**: el usuario llena el formulario de solicitud (`solicitud.html`) → `POST /solicitudes`.
2. **Evaluación**: `ia-engine.js` asigna un puntaje y clasificación a la solicitud (`detalle-solicitud.html`).
3. **Decisión**: el comité admite (aprueba) o rechaza la solicitud (estados en `solicitudes`).
4. **Reporte**: la empresa instalada presenta su reporte trimestral (`reporte.html`) → `POST /reportesCumplimiento`.
5. **Cumplimiento**: `compliance-engine.js` compara los valores reales contra los compromisos originales (`solicitudes`).
6. **Alerta y exportación**: se generan alertas (verde/amarilla/roja) y el consolidado se exporta a PROCOMER.

**Módulos clave:**

- `api.js` — cliente HTTP genérico con manejo central de errores hacia `http://localhost:3001`; expone servicios de `zonasFrancas`, `empresas`, `solicitudes` y `reportesCumplimiento`.
- `compliance-engine.js` — evalúa cada reporte y devuelve nivel de alerta, código de regla, desviaciones, mensajes y acción recomendada.
- `ia-engine.js` — asigna el puntaje de afinidad (0-100) y clasifica la solicitud, con evaluación en paralelo (`Promise.all`).
- `ui-helpers.js` — utilidades reutilizables: escape HTML (`esc`), formato de moneda/número/fecha, modales, loading con spinner Y2K, toasts, sparkles de cursor y emojis flotantes.

---

## Reglas de negocio

### De admisión (RA)
| Regla | Descripción |
| --- | --- |
| **RA-01** | Umbral de inversión mínima para el régimen |
| **RA-04** | Flexibilidad crítica de inversión (admite desviaciones justificadas) |
| **RA-05** | Empleo mínimo (ej. ≥ 10 empleos) |
| **RA-08** | Sector permitido (lista "lista positiva") |
| **RA-09** | Verificación de antecedentes |
| **RA-10** | Carta de compromiso del representante legal |

### De cumplimiento trimestral (RC)
| Código | Condición | Alerta |
| --- | --- | --- |
| **RC-01** | Desviación de inversión < 10% | ✅ En regla |
| **RC-02** | Desviación de inversión entre 10% – 25% | 🟡 Amarilla (recordatorio) |
| **RC-03** | Desviación de inversión > 25% (o 2 trimestres consecutivos > 10%) | 🔴 Roja (plan correctivo + PROCOMER) |
| **RC-04** | Empleos < 90% de la meta | 🟡 Amarilla |
| **RC-05** | Empleos < 75% en 2 trimestres | 🔴 Roja |
| **RC-06** | Reporte extemporáneo (después del día 15) | 🟡 Amarilla |
| **RC-07** | Reporte no recibido (después del día 25) | 🔴 Roja |

### Requisitos funcionales (RF)
| ID | Función |
| --- | --- |
| **RF-04** | Puntaje de afinidad vía IA (0–100) |
| **RF-05** | Clasificación automática (Recomendada / Revisar / Rechazada) |
| **RF-06** | Formulario de reporte trimestral de cumplimiento |
| **RF-07** | Motor de cumplimiento (reglas RC) |
| **RF-08** | Panel de alertas |
| **RF-09** | Exportación PROCOMER |
| **RF-10** | Modales de carga retro |
| **RF-11** | Errores amigables (no técnicos) |
| **RF-12** | Confirmar / rechazar / resetear clasificación IA |
| **RF-13** | Evaluación de solicitudes en paralelo (`Promise.all`) |
| **RF-14** | Modal de auditoría (historial completo por empresa) |
| **RF-15** | Barra de filtros (búsqueda, estado, sector, zona) |
| **RF-18** | Barra de métricas con contadores |

---

## Base de datos (json-server)

El servidor de datos se alimenta de `src/db.json` y expone colecciones REST en `http://localhost:3001`:

| Colección | Endpoint | Descripción |
| --- | --- | --- |
| `/solicitudes` | GET/POST | Solicitudes de admisión con compromisos (inversión, empleos, exportación), estado e historial |
| `/empresas` | GET/POST | Datos de las empresas (NIT, razón social, representante, zona asignada) |
| `/zonasFrancas` | GET/POST | Registro de zonas francas con criterios de admisión |
| `/reportesCumplimiento` | GET/POST | Reportes trimestrales de cumplimiento (inversión real, empleos, exportaciones) |

**✅ Estado del archivo `db.json`:** consolidado (esquema funcional unificado: `solicitudes`, `empresas`, `zonasFrancas`, `reportesCumplimiento`), sin marcadores de conflicto.

---

## Cómo ejecutar el proyecto

1. **Instalar dependencias** (dentro de `zonafranca/`):
   ```bash
   npm install
   ```
2. **Descargar e iniciar json-server** con la base de datos:
   ```bash
   npm install -g json-server      # si no lo tienes ya
   json-server --watch src/db.json --port 3001
   ```
3. **Iniciar Vite** (servidor de desarrollo):
   ```bash
   npm run dev
   ```
4. **Abrir en el navegador** la URL que muestre Vite (por defecto `http://localhost:5173`).

   > El Dashboard se sirve en la raíz (`/`). Las demás páginas están en `/reporte.html`, `/alertas.html`, `/solicitud.html` y `/detalle-solicitud.html`.

5. **Construcción de producción** (opcional):
   ```bash
   npm run build      # genera la carpeta dist/ con las 5 páginas + assets
   npm run preview    # sirve el build en http://localhost:4173
   ```

   > La app es una **aplicación multi-página (MPA)**: `vite.config.js` declara las 5 páginas HTML como entradas de build y `public/` queda reservado solo para los SVG estáticos (`favicon.svg`, `icons.svg`).

> Los scripts definidos en `package.json` son:
>
> ```json
> { "dev": "vite", "build": "vite build", "preview": "vite preview" }
> ```

---

## Notas y consideraciones

- **Servidor requerido:** el frontend consulta `http://localhost:3001`; sin json-server en ejecución, las páginas muestran errores de conexión (mensajes amigables).
- **Sin autenticación:** el sistema es un prototipo/demostración para la gestión de zonas francas; no incluye login, roles ni permisos.
- **Export PROCOMER:** la exportación es una **simulación** que genera un archivo `.txt` de texto plano (`downloadProcomerExport`).
- **Base de datos consolidada:** `db.json` quedó unificado en un solo esquema funcional.
- **Duplicados eliminados:** se removieron las copias en la raíz del directorio de trabajo (`index.html`, `package-lock.json`) y los archivos vacíos/de plantilla (`i.html`, `ii.html`, `main.js`, `counter.js`, `style.css`, `vite.svg`, `javascript.svg`); la fuente de verdad del proyecto es la carpeta `zonafranca/`.
- **Fondo neon dinámico (hacker):** `src/js/neon-bg.js` añade lluvia de código en rosa neón; `webcore.css` incorpora el tema **NEON HACKER** (rejilla animada, scanlines CRT, glow). `alertas.html` fue creado y `detalle.js` (página de detalle IA) fue implementado.
- **Build verificado ✓:** `npm run build` genera `dist/` con las 5 páginas correctamente empaquetadas (los módulos JS se resuelven con imports relativos — ya no se dependen de `importmap` del navegador). `npm run dev` y `npm run preview` sirven el Dashboard en `/`.

---

> Hecho con 💖 estilo Y2K para FranCat CR · © 2026