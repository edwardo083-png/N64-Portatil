'use strict';
// Utilidades compartidas: ajustes, biblioteca de ROMs (IndexedDB) y lectura de cabeceras.
(function (g) {
  const DEFAULTS = {
    general: { autoStart: true },
    video: { aspect: '4:3', resolution: '320x240', bilinear: '3point', antialias: '0', fxaa: '0', fbEmu: 'True' },
    audio: { volume: 80, mute: false },
    core: { cpu: 'dynamic_recompiler', rsp: 'hle', rdp: 'gliden64', pak: 'memory' }
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function merge(base, extra) {
    if (!extra || typeof extra !== 'object') return base;
    for (const k of Object.keys(base)) {
      if (!(k in extra)) continue;
      if (base[k] && typeof base[k] === 'object') merge(base[k], extra[k]); else base[k] = extra[k];
    }
    return base;
  }
  function getSettings() {
    try { return merge(clone(DEFAULTS), JSON.parse(localStorage.getItem('n64.ajustes'))); } catch { return clone(DEFAULTS); }
  }
  function saveSettings(s) { try { localStorage.setItem('n64.ajustes', JSON.stringify(s)); } catch { /* sin espacio */ } }

  // ───────── Base de datos ─────────
  let dbp = null;
  function db() {
    if (!dbp) {
      dbp = new Promise((res, rej) => {
        const r = indexedDB.open('n64-portatil', 1);
        r.onupgradeneeded = () => {
          r.result.createObjectStore('roms', { keyPath: 'id', autoIncrement: true });
          r.result.createObjectStore('states');
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    }
    return dbp;
  }
  function run(store, mode, fn) {
    return db().then((d) => new Promise((res, rej) => {
      const t = d.transaction(store, mode);
      const q = fn(t.objectStore(store));
      t.oncomplete = () => res(q && q.result);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    }));
  }

  const REGIONS = { E: 'EE. UU.', J: 'Japón', P: 'Europa', X: 'Europa', Y: 'Europa', D: 'Alemania', F: 'Francia', I: 'Italia', S: 'España', U: 'Australia', A: 'Asia', B: 'Brasil', H: 'Países Bajos', W: 'Escandinavia', N: 'Canadá', C: 'China', K: 'Corea', G: 'Gateway 64', L: 'Gateway 64' };

  async function readHeader(file) {
    const raw = new Uint8Array(await file.slice(0, 64).arrayBuffer());
    if (raw.length < 64) return null;
    const sig = ((raw[0] << 24) | (raw[1] << 16) | (raw[2] << 8) | raw[3]) >>> 0;
    const b = raw.slice();
    let format;
    if (sig === 0x80371240) format = 'z64';
    else if (sig === 0x37804012) { format = 'v64'; for (let i = 0; i < 64; i += 2) { const t = b[i]; b[i] = b[i + 1]; b[i + 1] = t; } }
    else if (sig === 0x40123780) { format = 'n64'; for (let i = 0; i < 64; i += 4) { b.subarray(i, i + 4).reverse(); } }
    else return null;
    const latin = (from, to) => Array.from(b.subarray(from, to), (c) => String.fromCharCode(c)).join('');
    const name = latin(0x20, 0x34).replace(/\0+/g, ' ').replace(/[^\x20-\x7e\u00a0-\u00ff]/g, '').trim();
    const idRaw = latin(0x3b, 0x3f);
    const hex = (o) => ((b[o] << 24 | b[o + 1] << 16 | b[o + 2] << 8 | b[o + 3]) >>> 0).toString(16).toUpperCase().padStart(8, '0');
    return {
      format, name,
      id: /^[\x20-\x7e]{4}$/.test(idRaw) ? idRaw : '',
      region: REGIONS[idRaw[3]] || '',
      crc: hex(0x10) + ' / ' + hex(0x14)
    };
  }

  const EXT = ['z64', 'n64', 'v64', 'rom', 'zip'];
  const extOf = (n) => (n.split('.').pop() || '').toLowerCase();

  async function addRom(file) {
    const ext = extOf(file.name);
    if (!EXT.includes(ext)) return { ok: false, reason: 'Tipo no admitido' };
    const existing = await listRoms();
    if (existing.some((r) => r.fileName === file.name && r.size === file.size)) return { ok: false, reason: 'Ya está en la lista' };
    let h = null;
    if (ext !== 'zip') { try { h = await readHeader(file); } catch { /* sin cabecera */ } }
    if (ext !== 'zip' && !h && ext !== 'rom') return { ok: false, reason: 'No parece una ROM de N64' };
    const base = file.name.replace(/\.[^.]+$/, '');
    await run('roms', 'readwrite', (s) => s.add({
      fileName: file.name, title: (h && h.name) || base, size: file.size,
      format: h ? h.format : ext, id4: h ? h.id : '', region: h ? h.region : '', crc: h ? h.crc : '',
      added: Date.now(), data: file
    }));
    return { ok: true };
  }
  const listRoms = () => run('roms', 'readonly', (s) => s.getAll()).then((a) => (a || []).sort((x, y) => x.title.localeCompare(y.title, 'es', { sensitivity: 'base', numeric: true })));
  const getRom = (id) => run('roms', 'readonly', (s) => s.get(id));
  function deleteRom(id) {
    return run('roms', 'readwrite', (s) => s.delete(id))
      .then(() => run('states', 'readwrite', (s) => s.delete(IDBKeyRange.bound(id + ':', id + ':\uffff'))));
  }
  const putState = (romId, slot, bytes) => run('states', 'readwrite', (s) => s.put(bytes, romId + ':' + slot));
  const getState = (romId, slot) => run('states', 'readonly', (s) => s.get(romId + ':' + slot));
  const fmtSize = (n) => { const mb = n / 1048576; return (mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)).replace('.0', '') + ' MB'; };

  g.N64 = { DEFAULTS, getSettings, saveSettings, addRom, listRoms, getRom, deleteRom, putState, getState, fmtSize };
})(window);
