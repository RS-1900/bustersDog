# Guía de uso de la app Buster’s

## Para clientes

La app permite consultar el menú, guardar favoritos, preparar un carrito,
enviar pedidos anónimos y seguir su estado. No solicita nombre, matrícula,
correo ni teléfono.

### Consultar el menú

1. Abre la app y espera a que termine de cargar el catálogo.
2. Usa la búsqueda o los filtros por categoría.
3. Los productos o presentaciones con la etiqueta **Agotado** permanecen
   visibles, pero no pueden agregarse al carrito.
4. Al volver a la pantalla principal se actualiza el catálogo. Si el panel
   cambia una disponibilidad mientras la app está abierta, Socket.IO solicita
   automáticamente la versión nueva.

### Crear un pedido

1. Abre un producto.
2. Elige la presentación y las opciones requeridas.
3. Agrégalo al carrito.
4. Revisa cantidades, precios e indicaciones antes de confirmar.
5. Envía el pedido una sola vez y espera el folio de confirmación.

La app admite hasta tres productos diferentes y tres unidades totales por
producto, contando sus distintas presentaciones y opciones. Los precios finales
siempre son validados por el servidor.

Si la conexión se interrumpe durante el envío, no vacíes los datos de la app ni
crees inmediatamente otro pedido. La app conserva la sesión y la clave del
envío para recuperar o reintentar el pedido sin duplicarlo.

### Seguir un pedido

En **Mis pedidos**, abre el folio correspondiente. Socket.IO es el mecanismo
principal de actualización. Mientras el detalle está visible, la app también
consulta el servidor cada 20 segundos como respaldo. El botón **Actualizar
estado** permite una consulta manual.

El seguimiento automático deja de consultar cuando el pedido está entregado o
cancelado. Los pedidos anteriores muestran el último estado guardado si la
sesión de consulta ya venció.

### Notificaciones

En Android, permite las notificaciones cuando el sistema lo solicite. Cuando el
pedido pasa a listo, la app puede recibir un aviso mediante Expo Notifications.
El estado dentro de la app también se actualiza por Socket.IO y por el respaldo
periódico; una notificación no es el único mecanismo de seguimiento.

## Solución de problemas para clientes

- **El menú tarda en aparecer:** espera a que la API de Render despierte y usa
  **Volver a intentar** o desliza para actualizar.
- **Un producto sigue apareciendo agotado:** vuelve a la pantalla principal o
  actualiza el catálogo manualmente.
- **No cambia el estado del pedido:** abre su detalle y usa **Actualizar estado**.
- **No llegó el aviso:** revisa los permisos de notificación y consulta el
  pedido dentro de la app.
- **La cafetería aparece cerrada:** no se aceptarán pedidos nuevos, pero puedes
  consultar el menú y seguir pedidos existentes.

## Para desarrollo

### Requisitos e instalación

- Node.js 24.
- npm.
- Android Studio/emulador, Expo Go compatible o dispositivo Android para las
  pruebas que correspondan.

```sh
npm ci
npm start
```

La app usa por defecto la API compartida de Render. Para cambiarla, copia
`.env.example` a `.env` y define únicamente el origen, sin `/api/v1`:

```dotenv
EXPO_PUBLIC_API_URL=https://cafeteria-api-3hqs.onrender.com
```

Para un backend local usa:

- Web: `http://localhost:5000`.
- Emulador Android: `http://10.0.2.2:5000`.
- Teléfono físico: la IP LAN de la computadora, con ambos dispositivos en la
  misma red.

En web, agrega el origen mostrado por Expo a `MOBILE_ORIGINS` en el backend.
Nunca coloques contraseñas, URLs de base de datos ni secretos en variables
`EXPO_PUBLIC_*`.

### Comandos habituales

```sh
npm run android
npm run web
npm run typecheck
npm test
npm run format:check
```

Antes de entregar una versión también conviene validar las exportaciones:

```sh
npx expo export --platform web
npx expo export --platform android --output-dir dist-android
```

### Generar un APK interno

El perfil `preview` de `eas.json` usa la API pública y genera un APK de
distribución interna:

```sh
npx eas-cli build --platform android --profile preview
```

Debes iniciar sesión con una cuenta autorizada para el proyecto EAS. Antes de
crear una versión nueva, incrementa los números de versión que correspondan y
conserva `google-services.json`; no lo sustituyas sin coordinar también la
configuración de Firebase.

### Validación manual recomendada

1. Cargar y actualizar el catálogo.
2. Agregar variantes y opciones al carrito.
3. Crear un pedido sin doble envío.
4. Cambiar estados desde el panel y observar Socket.IO.
5. Desconectar temporalmente el socket y comprobar el polling de respaldo.
6. Marcar productos y variantes como agotados/disponibles.
7. Recibir la notificación de pedido listo en un Android físico.

Consulta también [README.md](README.md), [docs/INTEGRACION.md](docs/INTEGRACION.md)
y [docs/NOTIFICACIONES.md](docs/NOTIFICACIONES.md).

