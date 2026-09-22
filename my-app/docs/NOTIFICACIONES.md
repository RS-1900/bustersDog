# Notificaciones de pedidos

La app registra su Expo Push Token con la sesión de compra después del primer pedido. Solicita permiso del sistema, crea el canal Android `orders`, reintenta al volver a primer plano y abre el pedido al tocar un aviso. La autorización del pedido sigue dependiendo de la sesión guardada, nunca de los datos del aviso.

## Configuración pendiente antes de compilar

1. Firebase: registrar la app Android con paquete `com.bustersdog.app`.
2. Descargar `google-services.json` a la raíz de la app y configurar `expo.android.googleServicesFile` como `./google-services.json` en app.json.
3. Subir la credencial privada FCM V1 a las credenciales Android del proyecto Expo **axel-glezz/busters-dog**. No incluir esa clave privada en Git, la APK ni la API.
4. API: ejecutar `node scripts/migrate-push.mjs` con DATABASE_URL del entorno correcto antes de desplegar el código. La migración agrega dos tablas privadas y no cambia los pedidos existentes.
5. Desplegar la API y generar otra APK con el perfil `preview`. Una APK anterior no obtiene la configuración nativa por actualizar JavaScript.

## Prueba en teléfono

- Instalar la APK nueva, crear un pedido de prueba y aceptar las notificaciones.
- Cerrar la app normalmente y cambiar el pedido a Preparando y Listo desde el panel.
- Comprobar texto/folio y tocar el aviso: debe abrir ese pedido.
- Repetir con dos teléfonos y verificar que no reciben pedidos ajenos.
- Denegar el permiso: la compra sigue funcionando; habilitarlo en Ajustes y abrir la app vuelve a registrar el teléfono.

## Operación

El servidor agrega avisos a una cola en la misma transacción del estado. Procesa la cola al cambiar estado, al arrancar y cada 30 segundos mientras está activo. Reintenta errores, consulta recibos de Expo y elimina tokens no registrados. La entrega es de mejor esfuerzo: un fallo de red tras aceptar Expo un envío puede duplicarlo. Los avisos pendientes vencen al cabo de una hora. Render gratuito suspende procesos inactivos: los reintentos pendientes continúan cuando el servidor vuelve a arrancar; para procesamiento continuo se necesita una instancia siempre activa.

No funciona en Expo Go Android ni en web. Android puede bloquear avisos tras Forzar detención o por restricciones de batería. En iOS se requieren además credenciales APNs y una compilación iOS.

Fuentes: https://docs.expo.dev/versions/v57.0.0/sdk/notifications/ y https://docs.expo.dev/push-notifications/fcm-credentials/
