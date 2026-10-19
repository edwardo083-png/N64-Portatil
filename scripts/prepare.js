// Copia EmulatorJS + el núcleo Mupen64Plus-Next a www/emu para que la app funcione sin Internet.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const nm = path.join(root, 'node_modules', '@emulatorjs');
const srcData = path.join(nm, 'emulatorjs', 'data');
const srcCore = path.join(nm, 'core-mupen64plus_next');
const out = path.join(root, 'www', 'emu', 'data');

if (!fs.existsSync(srcData) || !fs.existsSync(srcCore)) {
  console.error('Faltan dependencias. Ejecuta primero: npm install');
  process.exit(1);
}

fs.rmSync(path.join(root, 'www', 'emu'), { recursive: true, force: true });
fs.cpSync(srcData, out, { recursive: true });

// Solo las variantes sin hilos: los WebView de Android no suelen tener SharedArrayBuffer.
const coresDir = path.join(out, 'cores');
fs.mkdirSync(path.join(coresDir, 'reports'), { recursive: true });
for (const f of ['mupen64plus_next-wasm.data', 'mupen64plus_next-legacy-wasm.data']) {
  fs.copyFileSync(path.join(srcCore, f), path.join(coresDir, f));
}
const rep = path.join(srcCore, 'reports');
if (fs.existsSync(rep)) fs.cpSync(rep, path.join(coresDir, 'reports'), { recursive: true });

// Parche: sin comprobación de versión en línea.
const emuJs = path.join(out, 'src', 'emulator.js');
fs.writeFileSync(emuJs, fs.readFileSync(emuJs, 'utf8').replace('checkForUpdates() {', 'checkForUpdates() { return;'));

for (const f of ['loader.js', 'src/emulator.js', 'cores/mupen64plus_next-wasm.data']) {
  if (!fs.existsSync(path.join(out, f))) { console.error('Falta ' + f); process.exit(1); }
}
console.log('Núcleo y frontend listos en www/emu/data');
