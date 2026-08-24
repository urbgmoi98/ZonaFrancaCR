/* ============================================================
   FranCat CR — Módulo 2 · vite.config.js
   ------------------------------------------------------------
   Configuración de Vite como aplicación multi-página (MPA).

   - Las 5 páginas HTML viven en la raíz del proyecto y cada una
     es un “entry” de build (build.rollupOptions.input).
   - `public/` queda reservado SOLO para estáticos que se copian
     tal cual al build (favicon.svg, icons.svg).
   - Los módulos JS se importan con rutas relativas (./, ../)
     para que Vite los bundle correctamente en producción.
   ============================================================ */

import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Resuelve una ruta absoluta en la raíz del proyecto (ESM-safe).
const resolveFromRoot = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  // publicDir: 'public'  ← default; reservado para favicon.svg / icons.svg
  build: {
    rollupOptions: {
      input: {
        main: resolveFromRoot('index.html'),
        reporte: resolveFromRoot('reporte.html'),
        alertas: resolveFromRoot('alertas.html'),
        solicitud: resolveFromRoot('solicitud.html'),
        detalle: resolveFromRoot('detalle-solicitud.html'),
      },
    },
  },
});