/* FranCat CR · auth.js — Login unificado (Admin / Empleado / Usuario)
   Genera credenciales aleatorias (se LISTAN al final en login.html),
   maneja sesión activa, guardia por página y chip de sesión en .web-nav. */

export const ROLES = [
  { key: 'admin', label: 'Admin', icono: '🛡️', desc: 'Gestión total, decisiones del comité y auditoría' },
  { key: 'empleado', label: 'Empleado', icono: '👷', desc: 'Analista de cumplimiento, reportes y alertas' },
  { key: 'usuario', label: 'Usuario', icono: '🧑‍💼', desc: 'Consulta y envío de solicitudes de zona franca' },
];

const SC = 'fcc_credenciales_v1';
const SS = 'fcc_session_v1';
const LP = '/login.html';

function aleatorio(min, max) {
  const rango = max - min + 1;
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return min + (arr[0] % rango);
}

function cadena(long, alfab) {
  let out = '';
  for (let i = 0; i < long; i++) out += alfab[aleatorio(0, alfab.length - 1)];
  return out;
}

function contrasena() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ', a = 'abcdefghjkmnpqrstuvwxyz', n = '23456789', s = '!@#$%&*?';
  return cadena(4, A) + cadena(3, a) + cadena(2, n) + cadena(2, s) + cadena(12, A + a + n + s);
}

function usuario(key) {
  return key + '.' + aleatorio(10, 99) + cadena(4, 'abcdefghkmprstuvwxyz') + '@zonafranca.cr';
}

function leerCreds() {
  try {
    const raw = localStorage.getItem(SC);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

export function generarCredenciales(force = false) {
  const exist = leerCreds();
  if (!force && exist && exist.generadas) return exist;
  const creds = {};
  ROLES.forEach((r) => {
    creds[r.key] = { user: usuario(r.key), pass: contrasena(), label: r.label, icono: r.icono, desc: r.desc };
  });
  const data = { generadas: true, fecha: new Date().toISOString(), creds };
  try { localStorage.setItem(SC, JSON.stringify(data)); } catch (_) {}
  return data;
}

export function getCredenciales() {
  return leerCreds() || generarCredenciales();
}

export function sonCredencialesValidas(email, password) {
  const data = leerCreds();
  if (!data) return null;
  const mail = String(email || '').trim().toLowerCase();
  for (const r of ROLES) {
    const c = data.creds[r.key];
    if (c && String(c.user).toLowerCase() === mail && c.pass === password) return r;
  }
  return null;
}

export function iniciarSesion(email, password) {
  const rol = sonCredencialesValidas(email, password);
  if (!rol) return { ok: false, error: 'El usuario o la contraseña no coinciden 😿' };
  const data = leerCreds();
  const sesion = {
    role: rol.key, roleLabel: rol.label, icono: rol.icono,
    user: data ? data.creds[rol.key].user : email, at: Date.now(),
  };
  try { localStorage.setItem(SS, JSON.stringify(sesion)); } catch (_) {}
  return { ok: true, sesion };
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SS);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

export function cerrarSesion() {
  try { localStorage.removeItem(SS); } catch (_) {}
  window.location.href = LP;
}

export function rolInfo(key) {
  return ROLES.find((r) => r.key === key) || null;
}

function escNav(v) {
  const m = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(v || '').replace(/[&<>"']/g, (ch) => m[ch]);
}

function inyectarChip() {
  const nav = document.querySelector('.web-nav');
  if (!nav || nav.querySelector('.nav-session')) return;
  const sesion = getSession();
  if (!sesion) return;
  const chip = document.createElement('div');
  chip.className = 'nav-session';
  chip.title = sesion.user || sesion.roleLabel;
  chip.innerHTML =
    '<span class="nav-session-name">' + (sesion.icono || '🔓') + ' <b>' + escNav(sesion.roleLabel) + '</b></span>' +
    '<button type="button" class="nav-logout" title="Cerrar sesión">⏻ Salir</button>';
  chip.querySelector('.nav-logout').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); cerrarSesion(); });
  nav.appendChild(chip);
}

(function guardia() {
  const pag = window.location.pathname.split('/').pop() || '';
  if (pag === 'login.html') return;
  if (!getSession()) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(LP + '?next=' + next);
    return;
  }
  inyectarChip();
})();