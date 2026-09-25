# Buster’s: aplicación de clientes

Aplicación React Native con Expo SDK 57 para consultar el menú de la cafetería, personalizar productos, enviar pedidos anónimos y seguir su estado.

## 1. Requisitos

- [Node.js 24 y npm](https://nodejs.org/en/download).
- Navegador para la versión web; para móvil, Expo Go compatible con SDK 57 o una compilación nativa compatible.
- Acceso a la API. La app utiliza por defecto el servicio compartido de Render; no incluye el backend ni necesita credenciales de base de datos.

## 2. Instalar y ejecutar en web

Descarga el ZIP del repositorio y extráelo (clic derecho → **Extraer todo**), o clónalo si utilizas Git. Instala Node.js 24 con las opciones predeterminadas: npm viene incluido. Cierra y vuelve a abrir la terminal después de instalarlo.

En Windows, abre la carpeta extraída en el Explorador, escribe `powershell` en la barra de dirección y pulsa Enter. En macOS/Linux, abre Terminal y utiliza `cd "ruta de la carpeta extraída"`. La terminal es la ventana donde introduces los comandos. Copia una línea a la vez y espera a que termine antes de continuar. El proyecto ejecutable está en `my-app`; no instales dependencias en la raíz.

```sh
cd my-app
node --version
npm --version
npm ci
npm run web
```

Abre la dirección que muestre Expo, normalmente [http://localhost:8081](http://localhost:8081). Mantén la terminal abierta; pulsa **Ctrl+C** para detenerlo.

Para volver a abrir la app otro día, entra en `my-app` y ejecuta `npm run web`; no necesitas repetir la instalación. La primera compilación puede tardar unos minutos. Debes ver el menú de la cafetería; no hace falta una cuenta para consultar productos.

No necesitas crear `.env` para usar la API compartida. Comprueba que el [catálogo del servidor](https://cafeteria-api-3hqs.onrender.com/api/v1/catalogo) responde. Si el servicio tarda en despertar, espera y vuelve a intentar. Los pedidos enviados al servicio compartido son reales; usa una API de desarrollo para probar compras.

## 3. Configurar otra API (opcional)

Crea `my-app/.env` con el siguiente contenido para una API local:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:5000
```

Desde `my-app`, puedes copiar [.env.example](my-app/.env.example) con `Copy-Item .env.example .env` en PowerShell o `cp .env.example .env` en macOS/Linux. Si ya tienes `.env`, edítalo. Comprueba que el nombre final no sea `.env.txt`. La URL debe contener **solo el origen**, sin `/api/v1`, parámetros ni credenciales.

| Dónde ejecutas la app | Origen de una API local |
| --- | --- |
| Navegador de la misma computadora | `http://localhost:5000` |
| Emulador Android de Android Studio | `http://10.0.2.2:5000` |
| Teléfono físico | `http://IP_LAN_DE_TU_COMPUTADORA:5000` |

Para teléfono, sustituye el marcador por la IPv4 de la computadora (en Windows, consulta `ipconfig`), usa la misma red Wi-Fi y permite la conexión local al servidor. En web, configura `MOBILE_ORIGINS=http://localhost:8081` en el backend; si Expo usa otro origen o puerto, autoriza ese valor exacto. Reinicia la API y Expo después de cambiar sus variables.

El backend local debe estar arrancado y tener las rutas `/api/v1` y su base preparadas. Sigue el [README de la API y el panel](https://github.com/axel-glez/cafeteria-api#readme). Después de crear el administrador, abre `http://localhost:5000`, pulsa **Nuevo producto**, crea la primera categoría dentro del formulario y guarda al menos un producto. Hasta entonces, el catálogo local de la app aparecerá vacío. Para ejecutar esta app de forma independiente puedes usar el servicio compartido.

Las variables `EXPO_PUBLIC_*` se distribuyen con la aplicación: no pongas contraseñas ni secretos en ellas.

## 4. Ejecutar en móvil (opcional)

Desde `my-app`:

```sh
npm start
```

Escanea el QR con Expo Go compatible; teléfono y computadora deben estar en la misma red. Para emulador Android, instala Android Studio, crea e inicia un dispositivo virtual y ejecuta `npm run android`. Para simulador iOS, necesitas macOS y Xcode; ejecuta `npm run ios`.

La versión web permite comprobar la interfaz sin emuladores. Las notificaciones push requieren validar una compilación nativa y un dispositivo; una exportación JavaScript no equivale a esa prueba.

## Verificar

Desde `my-app`:

```sh
npm run typecheck
npm test
npm run format:check
npx expo export --platform web
```

La exportación web se escribe en `my-app/dist`. Comprueba manualmente que carga el catálogo, que las imágenes aparecen y que puedes añadir productos al carrito. En un entorno de desarrollo, confirma un pedido y verifica su seguimiento.

## Solución de problemas

- **No encuentra package.json:** entra en `my-app`.
- **PowerShell bloquea npm.ps1:** usa `npm.cmd` y `npx.cmd`.
- **npm busca un npm-cli.js inexistente:** repara Node.js/npm y revisa PATH.
- **No carga el menú:** comprueba la URL del catálogo, la configuración de la API y CORS.
- **La API local responde pero el menú está vacío:** entra al panel como administrador, crea primero una categoría desde **Nuevo producto** y después guarda un producto disponible.
- **El teléfono no conecta a localhost:** usa la IP LAN de la computadora.
- **Expo conserva la URL anterior:** detén el proceso y ejecuta `npx expo start --clear`.
- **Expo Go no admite el proyecto:** usa una versión compatible con SDK 57 o una compilación nativa; puedes ejecutar web mientras preparas el entorno móvil.

## Estructura y documentación

- `my-app/src/app`: pantallas y navegación.
- `my-app/src/components`: interfaz compartida.
- `my-app/src/services`: API, Socket.IO y notificaciones.
- `my-app/src/stores`: carrito, sesión y pedidos.
- `my-app/tests`: pruebas.

Consulta el [README de la app](my-app/README.md), la [guía de uso](my-app/GUIA-USO.md), el [contrato de API](my-app/docs/API-APP.md) y la [documentación de Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).

## Verificación de estas instrucciones

Revisión del 25 de septiembre de 2026 con Node.js 24.13.0 y npm 11.6.2: instalación limpia, comprobación de tipos, 36 pruebas y exportación web correctas. El arranque con `npm run web` entregó la página y su JavaScript con HTTP 200. Se comprobaron los enlaces de documentación; el catálogo compartido respondió HTTP 200 y autorizó el origen web `http://localhost:8081`.

La comprobación de formato también pasa después de aplicar el formato automático. No se probaron Android/iOS ni notificaciones en un dispositivo nativo. No se enviaron pedidos al servicio compartido.
