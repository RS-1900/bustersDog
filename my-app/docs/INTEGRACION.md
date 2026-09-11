# Integración y entrega al equipo

## Qué incluye esta rama

La app conserva el logo y la identidad amarilla de Buster’s y consume el catálogo real. El detalle representa variantes y grupos de opciones; el carrito cuenta unidades por producto, aunque cambie el tamaño. Confirmar crea una compra anónima, guarda el folio y permite consultar su estado. Se retiraron el catálogo JSON antiguo, el recargo local del 1 % y los controles de pago/programación sin implementación.

La API calcula los importes; la app muestra una estimación en centavos. Antes de enviar actualiza disponibilidad y precios. Si detecta un cambio de precio, pide revisar el nuevo total y confirmar otra vez. El total final es el devuelto por el servidor; un cambio simultáneo en el servidor entre esa consulta y el envío puede producir un total diferente.

## Coordinación del backend

El backend y el panel existentes se mantienen fuera de este repositorio. En la computadora de integración ya se aplicó y verificó el límite de tres productos y tres unidades por producto. Se adjunta [backend-cart-limits.patch](backend-cart-limits.patch) con los cambios de código y pruebas para trasladarlos a otra copia de **esa misma API normalizada**.

El parche modifica únicamente:

- `src/routes/orders.ts`: hasta 9 líneas, cantidad máxima 3 por línea y suma por `product_id` para imponer el límite real.
- `src/lib/catalog.ts` y `src/app.ts`: código opcional de error `ORDER_REJECTED`.
- `tests/orders.integration.test.ts`: límites por tamaños/opciones, cuarto producto y pedido máximo válido.

En una copia del backend compatible, revisar y comprobar antes de aplicar:

```sh
git apply --check /ruta/a/backend-cart-limits.patch
git apply /ruta/a/backend-cart-limits.patch
npx tsc --noEmit
npx tsx --test --test-concurrency=1 tests/orders.integration.test.ts
```

No volver a aplicar si ya está incorporado. Un fallo de `--check` indica que esa copia requiere revisar diferencias; no forzar reemplazos. Las pruebas de integración necesitan la base de pruebas y crean datos temporales que limpian al terminar. Este parche no instala el backend, no migra una base antigua ni contiene credenciales.

`409` con `code: ORDER_REJECTED` significa que el servidor rechazó por disponibilidad y no creó la compra: la app desbloquea el carrito para corregirlo. Un `409` sin ese código conserva el envío pendiente, porque puede tratarse de una clave ya utilizada. No convertir todos los `409` en un pedido nuevo.

## Contrato compartido

El [contrato](API-APP.md) y [OpenAPI](openapi.json) describen las rutas y campos que debe conservar el equipo. Cambiar nombres de campos, tipos de importes o identificadores exige coordinar app y API. Los UUID del catálogo se usan tal como llegan. No importar el JSON retirado ni generar precios sumando cantidades fijas.

No se implementaron pagos en línea ni pedidos programados. Para agregarlos primero hay que acordar reglas, estados y contrato de servidor. Los empleados siguen usando su panel autenticado; el token de compra no otorga acceso al panel.

## Verificaciones realizadas el 11 de septiembre de 2026

- TypeScript de la app y de la API: correcto.
- 14 pruebas automatizadas de la app: correctas, sin usar datos personales ni la base.
- Prueba de integración de pedidos de la API: correcta, incluyendo permisos, historial, reintentos y límites 3 × 3.
- Recorrido del cliente y store reales contra la API y base: catálogo → dos M y un G → rechazo de cuarta unidad → pedido de $110.00 → aparece en el tablero → preparación → listo → entregado. Se eliminaron exclusivamente los registros temporales de esa comprobación.
- Exportación web y paquete JavaScript/Hermes para Android: correctos.
- Inspección de interfaz web: catálogo real, búsqueda y detalle con M 350 ml, G 470 ml y +G 590 ml y sus precios. El recorrido visual completo de confirmación todavía debe repetirse en un dispositivo; la comprobación completa anterior fue a través del cliente/store reales.

## Siguiente comprobación conjunta

1. Ejecutar la API actualizada y configurar `EXPO_PUBLIC_API_URL` en el teléfono de prueba.
2. Probar navegación, teclado, fotos y textos largos en pantalla pequeña; confirmar opciones obligatorias y favoritos.
3. Agregar dos M y un G del mismo producto; comprobar que rechaza otra unidad y un cuarto producto distinto.
4. Confirmar un pedido de prueba y localizar el mismo folio en el panel. Con la cuenta de empleado, pasar por preparación, listo y entregado; comprobar el seguimiento en la app.
5. Interrumpir la conexión después del envío y reintentar: debe recuperar el mismo folio. Cerrar y volver a abrir la app nativa con un envío pendiente; comprobar su recuperación.
6. Probar agotados y cambio de precio desde el panel; revisar mensajes y corrección del carrito.
7. Revisar y fusionar el PR con el compañero. Antes de distribuir, definir alojamiento HTTPS de API/panel, respaldo de la base y compilación instalada en Android/iOS.

La exportación no certifica un APK, una instalación iOS ni el funcionamiento de SecureStore en un teléfono. No se desplegó la API a internet en esta entrega.
