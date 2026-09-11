# Contrato de integración con la app

Versión 1. Base local: `http://localhost:5000`. Especificación para importar en herramientas de API: [openapi.json](openapi.json).

Desde un teléfono, `localhost` es el propio teléfono. En pruebas dentro de la misma red se usa la dirección de la computadora que ejecuta la API. El despliegue debe usar HTTPS. La app nunca recibe `DATABASE_URL`, claves de Supabase ni credenciales del personal.

## Flujo mínimo del compañero

1. Consultar `GET /api/v1/catalogo` y renderizar productos, presentaciones y grupos de opciones.
2. Obtener una sesión con `POST /api/v1/sesiones`, cuerpo `{}`. Guardar su token en el almacenamiento seguro de la plataforma; no incluirlo en capturas, registros o enlaces. Reutilizarlo hasta su vencimiento.
3. Al confirmar el carrito, generar una sola UUID para `Idempotency-Key`. Conservar la clave y el cuerpo exacto mientras se espera una respuesta o se reintenta.
4. Enviar `POST /api/v1/pedidos` con los ID de las variantes, cantidades y opciones.
5. Consultar `GET /api/v1/pedidos/{id}` con el mismo token para mostrar su estado. Un intervalo de 15 segundos basta para esta versión; detenerlo al entregar, cancelar o salir de la pantalla.

## Cabeceras

En todas las escrituras:

```http
Content-Type: application/json
X-Cafe-Request: 1
```

En la creación y consulta de pedidos:

```http
Authorization: Bearer TOKEN_DE_LA_SESION
```

Además, al crear un pedido:

```http
Idempotency-Key: UUID_GENERADA_UNA_VEZ_PARA_ESE_ENVIO
```

La API móvil no usa las cookies del panel. Para una app web en otro origen, configurar `MOBILE_ORIGINS` en el backend con orígenes exactos separados por comas, por ejemplo `http://localhost:5173`, y reiniciar. No se admite `*`; la autorización adicional se limita a `/api/v1`. En una app nativa normalmente no se envía `Origin` y no hace falta esta configuración.

## Catálogo

La respuesta contiene `currency: "MXN"` y `products`. Cada producto incluye:

- `id`, `name`, `description`, `image`, `category_id` y `category`.
- `variants`: `id`, `presentation_id`, `label`, `volume_ml`, `price` y disponibilidad. Se envía **el ID de la variante**, no el ID del producto, para pedirla.
- `modifier_groups`: `id`, `name`, `min_selections`, `max_selections` y `options`. Cada opción contiene `id`, `name`, `price` adicional y disponibilidad.

El catálogo público excluye productos y variantes archivados o no disponibles; las opciones no disponibles tampoco se publican. Si un grupo exige una selección y no tiene opciones disponibles, la app debe impedir agregar ese producto hasta que vuelva a haber una opción válida.

Los importes se expresan como cadenas decimales, por ejemplo `"37.15"`, para evitar conversiones prematuras a números binarios. El precio del producto es una referencia «desde» calculada; el carrito debe usar el precio de la variante seleccionada más sus opciones.

## Crear pedido

Ejemplo de estructura; sustituir las UUID por identificadores obtenidos del catálogo:

```json
{
  "items": [
    {
      "variant_id": "11111111-1111-4111-8111-111111111111",
      "quantity": 2,
      "option_ids": ["22222222-2222-4222-8222-222222222222"]
    }
  ]
}
```

`option_ids` puede omitirse cuando el producto no exige opciones. No enviar nombres, correos, notas, precios ni totales: los campos ajenos al contrato se rechazan. Máximo de 3 productos distintos y 3 unidades totales por producto, sumando todas sus presentaciones y opciones (hasta 9 partidas; cantidades de 1 a 3) y hasta 12 opciones por partida, además de las reglas de cada grupo. El cuerpo completo no debe superar 16 KB.

Respuesta: 201 al crear; 200 si se recupera un pedido ya creado con la misma clave. Ambas contienen el mismo pedido y su ID. `Idempotency-Replayed` indica `true` o `false`.

El pedido incluye `id`, `folio`, `status`, `currency`, `total`, fechas e `items`. Cada partida devuelve nombre comprado, presentación, volumen, cantidad, `base_price`, `unit_price`, `line_total` y opciones con sus nombres y precios históricos. El precio de una opción se aplica por unidad: dos bebidas de $37.15 con un complemento de $12.35 cada una producen $99.00.

Un reintento debe mantener sesión, clave y contenido. Si el usuario modifica el carrito tras recibir un rechazo definitivo, generar una nueva clave. Si hubo una interrupción y no se sabe si se creó el pedido, reintentar primero con la clave original. No solicitar otra sesión para resolver un fallo de red: el pedido anterior pertenece a la sesión original.

## Estados y errores

| Valor | Mostrar en la app |
|---|---|
| `new` | Recibido |
| `preparing` | En preparación |
| `ready` | Listo para recoger |
| `delivered` | Entregado |
| `cancelled` | Cancelado |

Solo el equipo autenticado puede cambiar estados. El cliente no puede listar pedidos ajenos ni modificar sus importes o estados.

| Código | Tratamiento |
|---|---|
| 400 | Revisar campos, cantidades y selecciones obligatorias; mostrar `error` y `details` si existen |
| 401 | Falta el token o venció la sesión; crear otra sirve para compras nuevas, no da acceso a pedidos anteriores |
| 403 | Revisar origen y cabeceras de escritura |
| 404 | Pedido inexistente o ajeno a la sesión; no revelar cuál de los dos casos ocurrió |
| 409 | Con `code: ORDER_REJECTED`, no se creó el pedido: actualizar catálogo y permitir corregir el carrito. Sin ese código, conservar sesión, clave y cuerpo para revisar el conflicto de idempotencia |
| 413 | El cuerpo supera 16 KB |
| 429 | Esperar lo indicado en `Retry-After`; conservar la clave del pedido |
| 500 | Mostrar un error temporal y permitir reintentar con la misma clave |

Límites iniciales para la demostración: 60 sesiones nuevas por minuto globalmente, 120 envíos de pedidos por minuto globalmente y 10 por sesión por minuto. Los envíos rechazados y reintentos también cuentan. Estos límites no almacenan IP ni nombres y deben dimensionarse antes de un uso mayor.

## Rutas del panel del equipo

Requieren la cookie de sesión del personal y no deben usarse con el token de un cliente:

- `GET /pedidos?limit=100&cursor=UUID`: página de pedidos (`orders`, `next_cursor`). Omitir cursor en la primera página; límite 1–100. Opcionales: `status` o `scope=active`.
- `GET /pedidos/{id}`: detalle e historial.
- `PATCH /pedidos/{id}/estado`: `{ "from_status": "new", "status": "preparing" }`. Si otro empleado ya cambió el estado, responde 409.
- `GET /modificadores`; administrador: `POST /modificadores` y `PUT /modificadores/{id}`. Grupos con `name`, `min_selections`, `max_selections`, `options`; conservar los ID de opciones existentes al editar.
- `PATCH /productos/{id}`: admite `modifier_group_ids` y variantes con `id` para conservar su identidad al cambiar la etiqueta. La categoría puede enviarse por `category_id`; se mantiene `category` por compatibilidad.
- `PATCH /productos/{id}/variantes/{variantId}`: `{ "available": false }`, también permitido al empleado.
- `DELETE /productos/{id}`: el administrador archiva el producto; no elimina sus pedidos.

Para la primera integración, probar un pedido con dos tamaños distintos, otro con un sabor obligatorio, un reintento de la misma compra y la consulta con un token diferente. La API ya incluye pruebas automatizadas para estos límites; la app integra catálogo, compra y seguimiento conforme a este contrato.
