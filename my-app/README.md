# Buster’s — app de clientes

App de React Native con Expo SDK 57. Permite consultar el catálogo real, elegir presentaciones y complementos, guardar favoritos, confirmar pedidos anónimos y seguir su estado.

## Iniciar

Requisitos: Node.js 24, npm y acceso a la API del proyecto (con su base normalizada y rutas `/api/v1`). Este repositorio contiene la app; el backend y el panel se mantienen por separado.

```sh
cd my-app
npm ci
```

Copia `.env.example` a `.env` y configura **solo el origen** de la API:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:5000
```

- Web en la misma computadora: `http://localhost:5000`.
- Emulador Android: `http://10.0.2.2:5000`.
- Teléfono físico: dirección LAN de la computadora que ejecuta la API, misma red y acceso permitido al puerto. `localhost` en el teléfono apunta al propio teléfono.
- Publicación: origen HTTPS accesible desde el dispositivo. No desactivar las protecciones de transporte de una compilación para usar HTTP en producción.

```sh
npm start
# o
npm run web
```

Para web, configura `MOBILE_ORIGINS=http://localhost:8081` en el backend, usando el origen real que muestre Expo; reinicia la API. Esa autorización se limita a `/api/v1`. Reinicia Expo si cambias `.env`.

`EXPO_PUBLIC_*` se incluye en la app distribuida. Nunca colocar aquí contraseñas, `DATABASE_URL`, claves de Supabase ni credenciales del personal.

## Reglas

- Hasta **3 productos diferentes y 3 unidades totales por producto**, sumando tamaños y complementos. Puede haber hasta 9 líneas de combinaciones distintas.
- Los tamaños vienen del catálogo: M 350 ml, G 470 ml, +G 590 ml o presentaciones especiales. No se inventan tamaños ni precios.
- Cada línea se identifica por variante + opciones. El servidor valida disponibilidad, opciones y total.
- El carrito se conserva durante el envío. Solo se vacía después de recibir un pedido confirmado.
- Los reintentos conservan sesión, clave y cuerpo. Una respuesta perdida no se resuelve creando otro pedido.
- El estado se consulta cada 15 segundos mientras el detalle está visible y la app está activa; se detiene al entregar o cancelar.

## Datos en el dispositivo

En Android/iOS, la sesión se guarda con SecureStore; carrito, favoritos, últimos 50 pedidos y envío pendiente usan AsyncStorage. No se solicitan nombres, matrículas, correos ni teléfonos.

En la vista web de demostración, todos esos datos usan `sessionStorage`: sobreviven a recargas en la misma pestaña, pero no se promete conservarlos al cerrar la pestaña. Mantén abierta la sesión hasta recibir el folio. El token web es accesible al JavaScript del mismo origen; no equivale al almacenamiento seguro nativo.

La sesión de compra vence a los siete días. Los pedidos anteriores conservan su último estado local; una sesión nueva no permite consultarlos. Si la sesión de un envío pendiente se perdió o venció, consulta con la cafetería antes de volver a ordenar. No borres el almacenamiento para resolver una respuesta perdida.

## Verificar

```sh
npm run typecheck
npm test
npm run format:check
npx expo export --platform web
npx expo export --platform android --output-dir dist-android
```

Las pruebas cubren límites por producto, opciones, importes en centavos, persistencia previa al envío, doble toque, pérdida de respuesta, reinicio, cambio de precio, agotados y errores del servidor. Las exportaciones validan los paquetes JavaScript; no generan un APK ni sustituyen pruebas en Android/iOS.

## Organización

- `src/app`: pantallas y navegación.
- `src/components`: interfaz compartida.
- `src/domain`: reglas del carrito e importes.
- `src/services`: contrato HTTP y configuración pública.
- `src/stores`: estado, persistencia y ciclo del pedido; la lógica permite dependencias simuladas en pruebas.
- `src/types`: esquemas Zod para validar datos recibidos y guardados.
- `tests`: pruebas sin acceso a la base ni credenciales.

Se retiró `data/products.json`: estaba desactualizado y no debe importarse a la base.

Consulta el [contrato de API](docs/API-APP.md), [OpenAPI](docs/openapi.json), [modelo de datos](docs/BASE-DE-DATOS.md) y [guía para el equipo](docs/INTEGRACION.md).
