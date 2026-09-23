# Cambio: aviso flotante al agregar al carrito

Fecha: 22 de septiembre de 2026

## Qué cambió

- El mensaje de confirmación ya no aparece como texto dentro del contenido de la pantalla.
- Ahora se muestra una tarjeta flotante en la parte superior, sin desplazar ni deformar el diseño.
- El aviso incluye una confirmación visual, el nombre del producto y la cantidad total de unidades en el carrito.
- Se oculta automáticamente después de 2.6 segundos.
- Si se agrega otro producto mientras está visible, el aviso se actualiza y vuelve a iniciar su tiempo de lectura.
- Está montado globalmente, por lo que funciona desde cualquier pantalla que agregue productos al carrito.
- Se anunció como alerta accesible para lectores de pantalla.

Ejemplo: `Cappuccino Italiano agregado al carrito.`

## Verificación

- Comprobación TypeScript: correcta.
- Formato de los archivos modificados: correcto.
- Se agregó una prueba para confirmar que el nombre del producto aparece y que cerrar el aviso no elimina errores independientes.
- El ejecutor local `tsx` no pudo iniciar la prueba por el error de memoria del runtime que afecta esta instalación; no se produjo un error de la aplicación.
