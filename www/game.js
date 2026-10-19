'use strict';
const $ = (id) => document.getElementById(id);
const romId = Number(new URLSearchParams(location.search).get('id'));
let baseName = 'juego';
let toastTimer = null;
let leaving = false;

function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 1800);
}
function fail(msg) { const b = $('boot'); b.className = 'err'; b.textContent = msg; $('menuBtn').hidden = false; }
const emu = () => window.EJS_emulator;
const slot = () => Number($('slot').value);
const stateFile = (n) => (n + 1) + '-quick.state';

function flushSaves() { try { emu().gameManager.saveSaveFiles(); } catch { /* sin partida */ } }
function exit() { if (leaving) return; leaving = true; flushSaves(); setTimeout(() => { location.href = 'index.html'; }, 120); }

async function saveState() {
  const e = emu(); if (!e || !e.gameManager) return;
  if (!e.gameManager.quickSave(slot() + 1)) return toast('No se pudo guardar el estado');
  try {
    await N64.putState(romId, slot(), e.gameManager.FS.readFile('/' + stateFile(slot())));
    toast('Estado guardado en la ranura ' + slot());
  } catch { toast('No se pudo guardar (¿falta espacio?)'); }
}
async function loadState() {
  const e = emu(); if (!e || !e.gameManager) return;
  const bytes = await N64.getState(romId, slot());
  if (!bytes) return toast('La ranura ' + slot() + ' está vacía');
  try { e.gameManager.FS.writeFile('/' + stateFile(slot()), bytes); e.gameManager.quickLoad(slot() + 1); toast('Estado cargado'); }
  catch { toast('No se pudo cargar el estado'); }
}

function openPanel() { $('panel').classList.add('on'); $('bd').classList.add('on'); }
function closePanel() { $('panel').classList.remove('on'); $('bd').classList.remove('on'); }

function wireUi() {
  for (let i = 0; i < 10; i++) { const o = document.createElement('option'); o.value = i; o.textContent = 'Ranura ' + i; $('slot').append(o); }
  $('menuBtn').addEventListener('click', openPanel);
  $('bd').addEventListener('click', closePanel);
  $('bResume').addEventListener('click', closePanel);
  $('bSave').addEventListener('click', () => { saveState(); closePanel(); });
  $('bLoad').addEventListener('click', () => { loadState(); closePanel(); });
  $('bReset').addEventListener('click', () => { const e = emu(); if (e && e.gameManager) { e.gameManager.restart(); toast('Reiniciado'); } closePanel(); });
  $('bPause').addEventListener('click', () => { const e = emu(); if (e) { e.togglePlaying(); $('bPause').textContent = e.paused ? 'Reanudar' : 'Pausar'; } closePanel(); });
  $('bExit').addEventListener('click', exit);
}

// Pausa al pasar la app a segundo plano y guarda la memoria del cartucho.
document.addEventListener('visibilitychange', () => {
  const e = emu();
  if (document.hidden) { flushSaves(); if (e && e.started && !e.paused) { e.pause(); window.__autoPaused = true; } }
  else if (window.__autoPaused && e) { window.__autoPaused = false; e.play(); }
});
addEventListener('pagehide', flushSaves);

(async () => {
  wireUi();
  try {
    const rom = await N64.getRom(romId);
    if (!rom) throw new Error('La ROM ya no está en la biblioteca.');
    const s = N64.getSettings();
    baseName = rom.fileName.replace(/\.[^.]+$/, '');
    document.title = rom.title;

    window.EJS_player = '#game';
    window.EJS_core = 'n64';
    window.EJS_pathtodata = '/emu/data/';
    window.EJS_gameUrl = URL.createObjectURL(rom.data);
    window.EJS_gameName = baseName;
    window.EJS_DEBUG_XX = true;
    window.EJS_language = 'es-ES';
    window.EJS_color = '#3b9cff';
    window.EJS_startOnLoaded = !!s.general.autoStart;
    window.EJS_volume = s.audio.mute ? 0 : s.audio.volume / 100;
    window.EJS_threads = false;
    window.EJS_defaultOptions = {
      'mupen64plus-cpucore': s.core.cpu,
      'mupen64plus-rsp-plugin': s.core.rsp,
      'mupen64plus-rdp-plugin': s.core.rdp,
      'mupen64plus-pak1': s.core.pak,
      'mupen64plus-aspect': s.video.aspect,
      'mupen64plus-43screensize': s.video.resolution,
      'mupen64plus-BilinearMode': s.video.bilinear,
      'mupen64plus-MultiSampling': s.video.antialias,
      'mupen64plus-FXAA': s.video.fxaa,
      'mupen64plus-EnableFBEmulation': s.video.fbEmu
    };
    // El menú propio guarda los estados de forma permanente; ocultamos los botones equivalentes de EmulatorJS.
    window.EJS_Buttons = { netplay: false, screenRecord: false, cacheManager: false, exitEmulation: false, saveState: false, loadState: false, quickSave: false, quickLoad: false };
    window.EJS_onGameStart = () => { const b = $('boot'); if (b) b.remove(); $('menuBtn').hidden = false; };

    const sc = document.createElement('script');
    sc.src = '/emu/data/loader.js';
    sc.onerror = () => fail('No se pudo cargar el emulador (falta la carpeta emu).');
    document.body.appendChild(sc);
    $('menuBtn').hidden = false;
  } catch (err) {
    fail('No se pudo abrir la ROM: ' + (err && err.message ? err.message : err));
  }
})();
