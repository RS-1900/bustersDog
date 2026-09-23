# Ajustes visuales en móvil

Fecha: 22 de septiembre de 2026

## Problemas corregidos

- Las tarjetas de productos ahora mantienen la misma altura, incluso cuando el nombre ocupa varias líneas.
- Las imágenes y el contenido de las tarjetas fueron compactados para evitar tarjetas excesivamente largas o corazones recortados.
- El precio permanece alineado en la parte inferior de cada tarjeta.
- La flecha para volver desde “Mis pedidos” ahora utiliza un símbolo claro y centrado.
- El carrusel de promociones tiene una altura estable y la imagen cubre toda la tarjeta, sin dejar un bloque de color vacío en la parte inferior.
- Se redujeron ligeramente los espacios y tamaños internos del anuncio para que título, descripción, botón e indicadores entren correctamente en pantallas móviles.

## Nota sobre las capturas

La rueda gris con engrane que aparece flotando sobre el carrito pertenece a las herramientas de desarrollo de Expo. No forma parte de la aplicación y no aparecerá en una build de producción.

## Verificación

- La comprobación de TypeScript terminó correctamente.
- Los componentes modificados cumplen el formato del proyecto.
- La ejecución automatizada de pruebas no pudo iniciar por un error de memoria del runtime local `tsx`; no produjo fallos de lógica ni de compilación de la aplicación.
