# Cambio: renovación de sesión de compra

Fecha: 22 de septiembre de 2026

## Problema

El teléfono podía conservar un token con fecha local vigente aunque esa sesión ya no existiera en el servidor. Al confirmar el carrito, el backend respondía `La sesión de compra terminó`.

## Solución

- Si la creación del pedido recibe HTTP 401, la app solicita una sesión nueva.
- Conserva exactamente el mismo contenido del pedido y su clave de idempotencia.
- Guarda la sesión renovada antes de reintentar.
- Reintenta una sola vez para evitar ciclos.
- Este reintento es seguro porque el backend valida la sesión antes de iniciar la creación del pedido.
- Al consultar un pedido antiguo cuya sesión expiró, la app conserva el último estado guardado y muestra una explicación más clara.

No se modificaron ni eliminaron pedidos de la base de datos.

## Verificación

- La base de datos tiene una sesión de compra activa y ninguna expirada; esto confirma que el teléfono podía conservar un token diferente al registrado actualmente.
- La comprobación TypeScript terminó correctamente.
- Se agregó una prueba que simula el rechazo 401, comprueba dos intentos y confirma que el carrito solo se vacía después de recibir el pedido correctamente.
