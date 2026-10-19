# N64 Portátil para Android

App de Nintendo 64 para Android que **funciona sin Internet**. Usa el mismo núcleo que la versión de Windows
(Mupen64Plus-Next mediante EmulatorJS) dentro de una app Android (Capacitor).

- Biblioteca de ROMs: las añades una vez y quedan guardadas dentro de la app.
- Controles táctiles en pantalla; los mandos Bluetooth/USB se detectan al pulsar un botón.
- Menú de juego con 10 ranuras de estados guardados permanentes, reiniciar y pausa.
- Ajustes de video (resolución, aspecto, filtros), audio y núcleo (CPU/RSP/RDP).
- La app pausa el juego al salir a segundo plano.

## Cómo conseguir el APK (sin instalar nada en tu PC)

Este proyecto se compila en los servidores gratuitos de GitHub. Hazlo una sola vez:

1. Crea una cuenta gratis en <https://github.com> (si no tienes).
2. Pulsa **New repository** (arriba a la derecha, el botón «+»). Ponle un nombre, por ejemplo `n64-portatil`.
   Puede ser **Private**. Pulsa **Create repository**.
3. En la página del repositorio vacío, pulsa **uploading an existing file**.
4. Descomprime este ZIP en tu PC y **arrastra todo el contenido de la carpeta** a esa página
   (incluida la carpeta oculta `.github`). Pulsa **Commit changes**.
   - Si `.github` no se sube, crea el archivo a mano: **Add file > Create new file**, escribe
     `.github/workflows/compilar-apk.yml` como nombre y pega el contenido del archivo del mismo nombre.
5. Ve a la pestaña **Actions**. Si te pide activarlas, acepta. Entra en **Compilar APK** y pulsa **Run workflow**.
   (También arranca solo al subir los archivos.)
6. Espera unos 5 a 10 minutos hasta ver la marca verde.
7. Ve a la pestaña **Code**, a la derecha pulsa **Releases** y descarga **N64-Portatil.apk**.
   Lo puedes hacer directamente desde el móvil.

Si falla (marca roja), abre la ejecución, copia el mensaje de error del paso que falló y envíamelo.

## Instalar en el teléfono

1. Abre el archivo `N64-Portatil.apk`.
2. Android pedirá permiso para **instalar apps de esta fuente**: actívalo para tu navegador o gestor de archivos.
3. Si aparece un aviso de Play Protect, elige **Instalar de todos modos** (el APK no está publicado en Play Store).

## Uso

1. Abre la app y pulsa **Añadir ROM**. Elige uno o varios archivos `.z64`, `.n64`, `.v64` o `.zip`.
2. Toca un juego para jugar. Toca **Menú** (arriba al centro) para guardar/cargar estado, reiniciar o salir.
3. El botón «Atrás» de Android vuelve a la lista y guarda la memoria del cartucho.

Consejos de rendimiento: empieza con la resolución nativa (320x240), que es la predeterminada. Si va fluido, puedes
subirla en Ajustes. Gira el teléfono en horizontal para jugar más cómodo.

## Notas

- No incluye ROMs. Usa solo respaldos de cartuchos que tú poseas.
- El APK es de depuración (firmado con la clave de pruebas): sirve para instalar y usar, pero no para Play Store.
- Licencia: GPL-3.0 (EmulatorJS y Mupen64Plus-Next).

## Desarrollo local (opcional)

Requiere Node 22, JDK 21 y Android SDK:

```
npm install
npm run preparar
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```
