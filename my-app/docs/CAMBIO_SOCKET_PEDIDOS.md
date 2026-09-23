# App: seguimiento de pedidos con Socket.IO

Fecha: 22 de septiembre de 2026

## Comportamiento

- Existe una sola instancia reutilizable de `socket.io-client` basada en `API_URL`.
- La app se une únicamente a las rooms de pedidos activos guardados en Zustand.
- Al recibir `order-status-updated`, valida UUID, estado y fecha antes de modificar el store.
- La lista y el detalle comparten el mismo pedido de Zustand; no se duplica estado en componentes.
- Los eventos antiguos no pueden revertir un estado más reciente.
- Al terminar o cancelar un pedido se abandona su room.
- Al pasar a segundo plano se abandonan las rooms y se desconecta; al volver se reconecta, se une de nuevo y hace una sola consulta de recuperación.
- Se eliminó el intervalo de consulta cada 15 segundos de la pantalla de seguimiento.
- Los listeners y la conexión se limpian al desmontar el layout.

Expo Notifications continúa funcionando sin cambios para segundo plano y app cerrada.

## Verificación

- TypeScript y Prettier correctos.
- Suite completa de la app: 36 pruebas aprobadas.
- Pruebas nuevas: validación del evento y actualización consistente de Zustand, incluyendo descarte de eventos antiguos.
- Prueba real con el servidor Socket.IO: evento recibido dentro de la room correcta.
