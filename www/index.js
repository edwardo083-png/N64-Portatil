'use strict';
const $ = (id) => document.getElementById(id);
let roms = [];
let toastTimer = null;

function toast(msg, ms = 2600) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), ms);
}

function openSheet(title, sub, body, actions) {
  const s = $('sheet');
  s.innerHTML = '';
  const h = document.createElement('h3'); h.textContent = title; s.append(h);
  if (sub) { const p = document.createElement('p'); p.className = 'sub'; p.textContent = sub; s.append(p); }
  if (body) { const pre = document.createElement('pre'); pre.textContent = body; s.append(pre); }
  const box = document.createElement('div'); box.className = 'acts';
  for (const a of actions) {
    const b = document.createElement('button');
    b.textContent = a.label;
    if (a.kind) b.className = a.kind;
    b.addEventListener('click', () => { closeSheet(); if (a.run) a.run(); });
    box.append(b);
  }
  s.append(box);
  s.classList.add('on'); $('bd').classList.add('on');
}
function closeSheet() { $('sheet').classList.remove('on'); $('bd').classList.remove('on'); }
$('bd').addEventListener('click', closeSheet);

const play = (r) => { location.href = 'game.html?id=' + r.id; };

function showInfo(r) {
  const lines = [
    'Archivo: ' + r.fileName, 'Nombre interno: ' + (r.format === 'zip' ? '—' : r.title), 'ID del cartucho: ' + (r.id4 || '—'),
    'Región: ' + (r.region || '—'), 'Formato: ' + r.format, 'Tamaño: ' + N64.fmtSize(r.size), 'CRC1 / CRC2: ' + (r.crc || '—')
  ];
  openSheet(r.title, null, lines.join('\n'), [{ label: 'Cerrar' }]);
}

function options(r) {
  openSheet(r.title, r.fileName, null, [
    { label: 'Jugar', kind: 'primary', run: () => play(r) },
    { label: 'Información de la ROM', run: () => showInfo(r) },
    { label: 'Eliminar de la app', kind: 'danger', run: () => confirmDelete(r) }
  ]);
}
function confirmDelete(r) {
  openSheet('¿Eliminar «' + r.title + '»?', null, 'Se borra la copia dentro de la app y sus estados guardados. Tu archivo original no se toca.', [
    { label: 'Eliminar', kind: 'danger', run: async () => { await N64.deleteRom(r.id); toast('ROM eliminada'); load(); } },
    { label: 'Cancelar' }
  ]);
}

function render() {
  const list = $('list');
  list.innerHTML = '';
  $('empty').classList.toggle('on', roms.length === 0);
  for (const r of roms) {
    const row = document.createElement('div'); row.className = 'row';
    const p = document.createElement('button'); p.className = 'play';
    const tile = document.createElement('div'); tile.className = 'tile';
    tile.textContent = r.id4 ? r.id4.slice(1, 3) : (r.format || '?').slice(0, 3).toUpperCase();
    const meta = document.createElement('div'); meta.className = 'meta';
    const b = document.createElement('b'); b.textContent = r.title;
    const sub = document.createElement('span');
    sub.textContent = [r.region, r.format, N64.fmtSize(r.size)].filter(Boolean).join(' · ');
    meta.append(b, sub); p.append(tile, meta);
    p.addEventListener('click', () => play(r));
    const more = document.createElement('button'); more.className = 'more'; more.textContent = '⋮'; more.setAttribute('aria-label', 'Opciones de ' + r.title);
    more.addEventListener('click', () => options(r));
    row.append(p, more); list.append(row);
  }
}

async function load() { roms = await N64.listRoms(); render(); }

async function addFiles(files) {
  let ok = 0; const skipped = [];
  for (let i = 0; i < files.length; i++) {
    toast('Añadiendo ' + (i + 1) + ' de ' + files.length + '…', 60000);
    try {
      const r = await N64.addRom(files[i]);
      if (r.ok) ok++; else skipped.push(files[i].name + ' (' + r.reason + ')');
    } catch { skipped.push(files[i].name + ' (error al guardar; ¿falta espacio?)'); }
  }
  await load();
  toast((ok ? ok + (ok === 1 ? ' ROM añadida' : ' ROMs añadidas') : 'No se añadió ninguna ROM') + (skipped.length ? '. Omitidas: ' + skipped.join(', ') : ''), 5000);
}

const pick = () => $('file').click();
$('add').addEventListener('click', pick);
$('add2').addEventListener('click', pick);
$('file').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  e.target.value = '';
  if (files.length) await addFiles(files);
});

if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
load();
