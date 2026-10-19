'use strict';
let cfg = N64.getSettings();
const main = document.getElementById('main');

const OPT = {
  aspect: [['4:3', '4:3 (original)'], ['16:9', '16:9 (estirado)'], ['16:9 adjusted', '16:9 ajustado']],
  resolution: ['320x240', '640x480', '960x720', '1280x960'].map((v) => [v, v + (v === '320x240' ? ' (nativa, más fluida)' : '')]),
  bilinear: [['3point', '3 puntos (estilo N64)'], ['standard', 'Estándar']],
  antialias: [['0', 'Desactivado'], ['2', '2x'], ['4', '4x']],
  cpu: [['dynamic_recompiler', 'Recompilador dinámico (rápido)'], ['cached_interpreter', 'Intérprete con caché'], ['pure_interpreter', 'Intérprete puro (lento)']],
  rsp: [['hle', 'HLE (rápido)'], ['cxd4', 'LLE cxd4 (preciso)']],
  rdp: [['gliden64', 'GLideN64 (GPU)'], ['angrylion', 'Angrylion (software, muy lento)']],
  pak: [['memory', 'Memory Pak'], ['rumble', 'Rumble Pak'], ['none', 'Ninguno']]
};

const get = (p) => p.split('.').reduce((o, k) => o[k], cfg);
function set(p, v) {
  const parts = p.split('.'); const last = parts.pop();
  parts.reduce((o, k) => o[k], cfg)[last] = v;
  N64.saveSettings(cfg);
}
function el(tag, props, ...kids) { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; }

function selectItem(label, path, options) {
  const s = el('select', { id: path });
  for (const [v, t] of options) s.append(el('option', { value: v, textContent: t }));
  s.value = String(get(path));
  s.addEventListener('change', () => set(path, s.value));
  return el('div', { className: 'item' }, el('label', { htmlFor: path, textContent: label }), s);
}
function checkItem(label, path, vals) {
  const on = vals ? vals[1] : true; const off = vals ? vals[0] : false;
  const c = el('input', { type: 'checkbox', id: path, checked: get(path) === on });
  c.addEventListener('change', () => set(path, c.checked ? on : off));
  return el('div', { className: 'item' }, el('label', { htmlFor: path, textContent: label }), c);
}
function rangeItem(label, path) {
  const val = el('span', { className: 'val', textContent: get(path) + ' %' });
  const r = el('input', { type: 'range', id: path, min: 0, max: 100, value: get(path) });
  r.addEventListener('input', () => { val.textContent = r.value + ' %'; set(path, Number(r.value)); });
  return el('div', { className: 'item' }, el('label', { htmlFor: path, textContent: label }), r, val);
}
const section = (t) => el('div', { className: 'sec', textContent: t });
const card = (...items) => el('div', { className: 'card' }, ...items);
const note = (t) => el('p', { className: 'note', textContent: t });

function build() {
  main.innerHTML = '';
  main.append(
    section('General'),
    card(checkItem('Iniciar el juego al abrirlo', 'general.autoStart')),
    section('Video'),
    card(
      selectItem('Relación de aspecto', 'video.aspect', OPT.aspect),
      selectItem('Resolución interna', 'video.resolution', OPT.resolution),
      selectItem('Filtrado de texturas', 'video.bilinear', OPT.bilinear),
      selectItem('Antialiasing (MSAA)', 'video.antialias', OPT.antialias),
      checkItem('FXAA', 'video.fxaa', ['0', '1']),
      checkItem('Emulación del framebuffer', 'video.fbEmu', ['False', 'True'])
    ),
    note('Una resolución más alta se ve mejor pero exige más al teléfono. Si el juego va a tirones, vuelve a la nativa.'),
    section('Audio'),
    card(rangeItem('Volumen', 'audio.volume'), checkItem('Silenciar', 'audio.mute')),
    section('Núcleo'),
    card(
      selectItem('CPU (R4300)', 'core.cpu', OPT.cpu),
      selectItem('RSP', 'core.rsp', OPT.rsp),
      selectItem('Procesador gráfico (RDP)', 'core.rdp', OPT.rdp),
      selectItem('Accesorio del mando 1', 'core.pak', OPT.pak)
    ),
    note('Los cambios se aplican la próxima vez que abras un juego. Los controles táctiles aparecen solos; los mandos Bluetooth se detectan al pulsar un botón.')
  );
  const reset = el('button', { textContent: 'Restablecer valores' });
  reset.addEventListener('click', () => { cfg = JSON.parse(JSON.stringify(N64.DEFAULTS)); N64.saveSettings(cfg); build(); });
  main.append(el('div', { className: 'foot' }, reset));
}
build();
