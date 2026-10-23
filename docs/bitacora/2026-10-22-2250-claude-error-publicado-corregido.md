# 22-oct-2026 22:50 · Claude · Error publicado 3 minutos y corregido (taller-prefactura.js)

Al renombrar «Precio del cliente» → «Nivel de precio» agregué un comentario `//` al final de una línea que seguía con más
código en la misma línea: el comentario se tragó el cierre `}` y el archivo quedó con error de sintaxis. La comprobación
de sintaxis falló, pero el `git push` estaba en otra línea del comando y se publicó igual (i9, ~22:42–22:45).
Corregido en i10 y verificado descargando el archivo publicado y parseándolo.

**Regla que queda:** nunca poner `//` al final de una línea con varias sentencias; y el push va encadenado con `&&`
después de la comprobación de sintaxis, nunca en una línea aparte.
