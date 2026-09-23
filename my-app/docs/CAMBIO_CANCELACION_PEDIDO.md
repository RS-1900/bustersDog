# Cambio: cancelación de pedido por el usuario

Fecha: 22 de septiembre de 2026

## Comportamiento

- En el detalle aparece “Cancelar pedido” únicamente mientras el estado sea `new` (recibido).
- La app solicita confirmación antes de cancelar.
- La confirmación usa un modal propio con los colores cálidos, bordes y jerarquía visual de Buster’s, en lugar del diálogo genérico de Android.
- “Conservar mi pedido” es la acción visual principal para reducir cancelaciones accidentales.
- El backend verifica que la sesión sea la propietaria del pedido.
- La operación bloquea el pedido durante el cambio para resolver correctamente una carrera con el panel.
- Si la cafetería lo marcó como `preparing` primero, responde con conflicto y la app actualiza el estado.
- Si la cancelación gana la carrera, el panel verá el pedido como cancelado y ya no podrá prepararlo.
- El cambio queda registrado en el historial del pedido como `new → cancelled`.
- No se elimina el pedido ni sus productos; se conserva para trazabilidad.

No se necesita una migración de base de datos porque `cancelled` ya era un estado admitido.

## Verificación

- Compilación TypeScript del backend: correcta.
- Comprobación TypeScript de la app: correcta.
- Formato de la app: correcto.
- Se agregaron pruebas para propiedad del pedido, cancelación exitosa, segundo intento, rechazo al comenzar la preparación, contrato HTTP y actualización del estado local.
