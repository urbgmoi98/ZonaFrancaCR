/* FranCat CR · kerbet.js — "Kerbet", el gato IA asistente
   Widget flotante que ayuda con solicitudes de zona franca CR.
   Se inyecta solo (CSS + HTML) en cualquier página que lo importe. */

const KERBET_CSS = `
  .kerbet-launcher { position: fixed; right: 22px; bottom: 22px; z-index: 7000;
    width: 64px; height: 64px; border-radius: 50%;
    background: radial-gradient(circle at 32% 28%, var(--pink,#ff8ff0), var(--hot,#ff2bd6) 78%);
    border: 3px solid #0b0112; box-shadow: 0 0 0 4px rgba(255,43,214,.35), 0 8px 22px rgba(0,0,0,.5);
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    font-size: 30px; transition: transform .18s ease; animation: kerbetFloat 3.2s ease-in-out infinite; }
  .kerbet-launcher:hover { transform: scale(1.1) rotate(-6deg); }
  .kerbet-launcher .kerbet-pip { position: absolute; top: -2px; right: -2px; width: 16px; height: 16px;
    background: #4dffc3; border: 2px solid #0b0112; border-radius: 50%; }
  @keyframes kerbetFloat { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-7px); } }
  .kerbet-launcher.is-open { transform: rotate(90deg); box-shadow: 0 0 26px rgba(255,43,214,.8); }
  .kerbet-panel { position: fixed; right: 22px; bottom: 100px; z-index: 7001;
    width: 350px; max-width: calc(100vw - 44px); height: 480px; max-height: calc(100vh - 130px);
    background: #150225; border: 3px solid var(--hot,#ff2bd6); border-radius: 16px 16px 4px 16px;
    outline: 2px solid rgba(255,43,214,.35); box-shadow: 0 0 30px rgba(255,0,120,.4), 0 14px 30px rgba(0,0,0,.55);
    display: none; flex-direction: column; overflow: hidden; }
  .kerbet-panel.abierta { display: flex; animation: kerbetPop .22s cubic-bezier(.2,.9,.3,1.2); }
  @keyframes kerbetPop { from{ transform: translateY(24px) scale(.92); opacity: 0; } to{ transform: none; opacity: 1; } }
  .ker-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px;
    background: linear-gradient(90deg, rgba(255,43,214,.35), rgba(255,43,214,.06));
    border-bottom: 3px solid rgba(255,43,214,.55); }
  .ker-head .ker-cara { font-size: 34px; filter: drop-shadow(0 0 8px rgba(255,43,214,.8)); animation: kerMeow 1.6s ease-in-out infinite; }
  @keyframes kerMeow { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-3px); } }
  .ker-head b { color: #ffeafb; font-size: 16px; text-shadow: 0 0 8px rgba(255,43,214,.5); }
  .ker-head .ker-sub { color: #c89bdc; font-size: 11px; font-family: var(--font-pixel,'Courier New'), monospace; }
  .ker-head .ker-close { margin-left: auto; background: none; border: 2px solid rgba(255,43,214,.5);
    color: #ffc2f5; border-radius: 8px; font-size: 12px; padding: 4px 9px; cursor: pointer; font-weight: 900; }
  .ker-msgs { flex: 1; overflow-y: auto; padding: 14px 12px; display: flex; flex-direction: column; gap: 8px; }
  .ker-bubble { max-width: 82%; padding: 9px 12px; border-radius: 12px 12px 12px 4px; font-size: 13px; line-height: 1.45;
    background: rgba(43,7,55,.85); color: #ffeafb; border: 1px solid rgba(255,43,214,.3); white-space: pre-wrap; }
  .ker-bubble.ker-user { align-self: flex-end; background: var(--hot,#ff2bd6); color: #14011c; font-weight: 700;
    border-radius: 12px 12px 4px 12px; border-color: transparent; }
  .ker-pensando { align-self: flex-end; display: inline-flex; gap: 5px; padding: 8px 12px; background: rgba(43,7,55,.85);
    border-radius: 12px 12px 4px 12px; }
  .ker-pensando span { width: 7px; height: 7px; border-radius: 50%; background: #ff8ff0; animation: kerDot 1s infinite; }
  .ker-pensando span:nth-child(2){ animation-delay: .2s; } .ker-pensando span:nth-child(3){ animation-delay: .4s; }
  @keyframes kerDot { 0%,100%{ opacity: .25; } 50%{ opacity: 1; } }
  .ker-chips { display: flex; gap: 6px; flex-wrap: wrap; padding: 0 12px 8px; }
  .ker-chip { font-size: 11px; padding: 5px 10px; border-radius: 30px; cursor: pointer;
    background: rgba(255,43,214,.14); color: #ffc2f5; border: 1px solid rgba(255,43,214,.5); transition: all .15s; }
  .ker-chip:hover { background: var(--hot,#ff2bd6); color: #14011c; }
  .ker-input { display: flex; gap: 8px; padding: 10px 12px; border-top: 3px solid rgba(255,43,214,.35); }
  .ker-input input { flex: 1; padding: 10px 12px; border: 2px solid rgba(255,43,214,.5); border-radius: 10px;
    background: #130220; color: #ffeafb; font-size: 13px; outline: none; }
  .ker-input input:focus { border-color: var(--hot,#ff2bd6); box-shadow: 0 0 0 3px rgba(255,43,214,.25); }
  .ker-input button { background: var(--hot,#ff2bd6); color: #14011c; border: none; border-radius: 10px;
    font-weight: 900; padding: 0 14px; cursor: pointer; }
  @media (max-width: 640px){ .kerbet-panel{ left: 8px; right: 8px; } }
`;

const KER_AVATAR = '😺';
const MEOWS = ['Miau... 🐾', '¡MMRMRMRR! 🐱', 'Purr purr... 💕', '¿Miau? 🐾'];

const KB = [
  { kw: ['hola','buenas','holi','saludo','hey','qué tal'], res: '¡Hola! 😺 Soy Kerbet, el gato IA de Zona Franca CR.\nTe ayudo con solicitudes, reportes y cumplimiento. ¿Qué necesitas?' },
  { kw: ['solicitud','solicitar','ingreso','admisión','admitir','requisito'], res: '¡Miau! 🐾 Para solicitar ingreso:\n1) Selecciona la EMPRESA con su NIT (Registro Nacional).\n2) Elige la ZONA FRANCA (Coyol, América, Heredia...).\n3) Indica el TIPO (Admisión, Beneficio, Ampliación...).\nLa IA asigna score 0–100 y el comité decide. 🧠✨' },
  { kw: ['documento','pdf','papel','expediente','completo','requisitos'], res: 'Documentos clave del expediente: 🗂️\n· Constitución y RUT/NIT vigente.\n· Carta de Compromiso RA-10 (inversión y empleos).\n· Declaración de nacionalidad y género.\n· Antecedentes comerciales (RA-09).' },
  { kw: ['estado','seguimiento','mi solicitud','revisión','avance'], res: 'Mira el estado en Dashboard 📊 y en Detalle de Solicitud.\nFlujo: Pendiente → En Revisión → Aprobada/Rechazada.\nCada cambio queda en la línea de trazabilidad (RF-14). 😺' },
  { kw: ['reporte','trimestral','rc-0','cumplimiento','envío'], res: 'El REPORTE TRIMESTRAL se envía ANTES del día 15 post-trimestre. 📋\nCompara inversión real, empleos y exportaciones contra tus compromisos (RC-01...RC-07). Pérdida &gt; 25% → alerta roja 🚨.' },
  { kw: ['alerta','alertas','procomer','consolidado'], res: 'El Panel de Alertas evalúa cada reporte y exporta el consolidado a PROCOMER 📤. Rojas=acción correctiva, Amarillas=recordatorio, Verdes=en regla.' },
  { kw: ['empresa','costa rica','ejemplo','costarricense','boston','britt','abbott'], res: 'Ejemplos de empresas instaladas en Zona Franca CR 🇨🇷:\n· Boston Scientific de CR\n· Abbott Medical CR\n· Café Britt S.A.\n· Logística Global CR\n· Frutipro del Caribe\n· Saso Bio Labs (I+D)\nTodas con NIT 3-... y expediente trazable.' },
  { kw: ['score','puntaje','ia','afinidad'], res: 'El SCORE IA combina: Sector (40 pts) + Inversión (30) + Empleos (30).\n≥75 = Recomendada · 50–74 = Revisar · &lt;50 = Rechazada. 🧠' },
  { kw: ['zona','qué es','franca'], res: 'Zona Franca = régimen especial en Costa Rica con beneficios tributarios para invertir y exportar 🇨🇷💖.\nFranCat CR administra la admisión y la supervisión (Módulo 2).' },
  { kw: ['tarde','extemporáneo','retraso','día'], res: 'Reporte tras el día 15 → alerta amarilla (RC-06). Si no llega al día 25 → roja (RC-07). Mejor enviarlo tempranito. 📅' },
  { kw: ['puntaje','clasific','recomendad','revisar','rechazada'], res: 'Clasificación por puntaje IA:\n· ≥75 Recomendadas (aprueba)\n· 50–74 Enviar (con observaciones)\n· <50 Rechazada.\nPuedes confirmarla o resetearla en el Detalle (RF-12).' },
  { kw: ['adios','chao','hasta luego','bye','gracias'], res: '¡De nada! 🐾 Gracias por pasarte. A la orden en FranCat CR 💖' },
];

const CHIPS = ['¿Cómo hago una solicitud?', '¿Qué documentos?', '¿Estado de mi solicitud?', '¿Cuándo envío el reporte?', 'Ejemplos de empresas CR'];

function respuestaPara(texto) {
  const t = ' ' + texto.toLowerCase() + ' ';
  for (const e of KB) {
    if (e.kw.some((k) => t.includes(k.toLowerCase()))) return e.res;
  }
  return MEOWS[Math.floor(Math.random() * MEOWS.length)] + ' No encontré esa respuesta exacta, pero puedo orientarte sobre solicitudes, documentos y reportes. ¿Me ayudas con un tema del menú? 🐾';
}

/* ---------- Construcción e inyección del widget ---------- */
const IDS = { launcher: 'kerbet-launcher', panel: 'kerbet-panel', msgs: 'kerbet-msgs', input: 'kerbet-input', chips: 'kerbet-chips', msgBox: 'kerbet-msgbox', sendBtn: 'kerbet-send' };

function construirHTML() {
  return `
    <div id="${IDS.launcher}" class="kerbet-launcher" title="Kerbet, tu asistente gatito IA" role="button" aria-label="Abrir Kerbet">
      ${KER_AVATAR}
      <span class="kerbet-pip"></span>
    </div>
    <div id="${IDS.panel}" class="kerbet-panel">
      <div class="ker-head">
        <span class="ker-cara">${KER_AVATAR}</span>
        <div>
          <b>Kerber</b>
          <div class="ker-sub">// asistente IA · zonafranca.cr</div>
        </div>
        <button type="button" class="ker-close" id="kerbet-close">✕ Cerrar</button>
      </div>
      <div id="${IDS.msgs}" class="ker-msgs"></div>
      <div id="${IDS.chips}" class="ker-chips"></div>
      <div class="ker-input">
        <input id="${IDS.input}" type="text" placeholder="Escribe tu pregunta... (miau)" autocomplete="off" />
        <button id="${IDS.sendBtn}" type="button">Miau</button>
      </div>
    </div>
  `;
}

function inyectarEstilo() {
  if (document.getElementById('kerbet-styles')) return;
  const st = document.createElement('style');
  st.id = 'kerbet-styles';
  st.textContent = KERBET_CSS;
  (document.head || document.documentElement).appendChild(st);
}

function burbuja(texto, esUsuario) {
  const cont = document.getElementById(IDS.msgs);
  if (!cont) return;
  const d = 8;
  const el = document.createElement('div');
  el.className = esUsuario ? 'ker-bubble ker-user' : 'ker-bubble';
  el.innerHTML = texto;
  cont.appendChild(el);
  cont.scrollTop = cont.scrollHeight;
}

function pensando(mostrar) {
  const cont = document.getElementById(IDS.msgs);
  if (!cont) return;
  const prev = document.getElementById('kerbet-pensando');
  if (prev) prev.remove();
  if (!mostrar) return;
  const d = document.createElement('div');
  d.className = 'pensando ker-pensando';
  d.id = 'kerbet-pensando';
  d.innerHTML = '<span></span><span></span><span></span>';
  cont.appendChild(d);
  cont.scrollTop = cont.scrollHeight;
}

async function responder(texto) {
  if (!texto || !texto.trim()) return;
  burbuja(texto, true);
  pensando(true);
  await new Promise((r) => setTimeout(r, 550 + Math.random() * 500));
  pensando(false);
  const res = respuestaPara(texto);
  burbuja(res, false);
}

function chipsSugeridas() {
  const cont = document.getElementById(IDS.chips);
  if (!cont) return;
  cont.innerHTML = '';
  CHIPS.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'ker-chip';
    b.type = 'button';
    b.textContent = c;
    b.addEventListener('click', () => {
      document.getElementById(IDS.input).value = c;
      responder(c);
    });
    cont.appendChild(b);
  });
}

function toggle(open) {
  const panel = document.getElementById(IDS.panel);
  const launch = document.getElementById(IDS.launcher);
  if (!panel) return;
  const ahora = panel.classList.contains('abierta');
  if (open === null ? !ahora : open) {
    panel.classList.add('abierta');
    launch.classList.add('is-open');
    launch.innerText = '✕';
    if (!document.getElementById('kerbet-greeted')) {
      setTimeout(() => {
        burbuja('¡Hola! Soy Kerber 😺. Puedo guiarte con tu solicitud en Zona Franca CR. ¿Empezamos?', false);
        document.getElementById('kerbet-greeted') && document.getElementById('kerbet-greeted').remove();
        const g = document.createElement('span'); g.id = 'kerbet-greeted'; g.style.display = 'none'; g...
      }, 650);
    }
  } else {
    panel.classList.remove('abierta');
    launch.classList.remove('is-open');
    launch.innerText = KER_AVATAR;
  }
}

function initKerbet() {
  if (document.getElementById(IDS.launcher)) return;
  inyectarEstilo();
  const wrap = document.createElement('div');
  wrap.innerHTML = construirHTML();
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

  const launch = document.getElementById(IDS.launcher);
  const input = document.getElementById(IDS.input);
  const send = document.getElementById(IDS.sendBtn);
  const close = document.getElementById('kerbet-close');

  launch.addEventListener('click', () => toggle(null));
  close.addEventListener('click', () => toggle(false));
  send.addEventListener('click', () => { responder(input.value); input.value = ''; });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { responder(input.value); input.value = ''; }
  });
  chipsSugeridas();
}

initKerbet();