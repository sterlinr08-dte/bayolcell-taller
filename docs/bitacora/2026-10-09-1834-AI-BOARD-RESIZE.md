# AI BOARD — tamaño del visor HD

La carga HD puede terminar mientras el usuario está en otra pestaña. El render anterior omitía dibujar con un visor oculto y no volvía a calcular al entrar en BITMAP; podía quedar vacío hasta tocar zoom o cambiar el tamaño de la ventana. El visor ahora recalcula al mostrar BITMAP y observa cambios de tamaño del contenedor, incluidos cambios de distribución sin resize de la ventana. No modifica los píxeles de la fuente ni añade detalle eléctrico.

La prueba HD abre la carpeta mientras está en Diagnóstico IA, vuelve a BITMAP y comprueba tiles visibles. Después cambia el ancho del contenedor a 320 px sin redimensionar la ventana y comprueba el ajuste de la fotografía. Mantiene las comprobaciones de caché limitada y limpieza al cambiar de usuario.

Comprobado localmente: 10/10 pruebas Chromium, incluidas carga oculta y ajuste al ancho interior del contenedor (excluye los bordes). Las otras 31 pruebas Node y 2 Python aprobaron antes de este cambio, que solo afecta al visor y su prueba. La fase previa de reintentos, commit 36746d79b50014c734afac71c601bb12f90e9452, aprobó los tres jobs remotos en [run 38000198352](https://github.com/sterlinr08-dte/bayolcell-taller/actions/runs/38000198352). Consultar CI del nuevo commit para WebKit y suite completa de esta fase. WebKit remoto y validación física siguen siendo comprobaciones distintas. Sin despliegue, SQL aplicado, mapas inventados o cambio a main.

Referencias: [PR 108](https://github.com/sterlinr08-dte/bayolcell-taller/pull/108), [formato HD](../AI_BOARD_PHOTO_PYRAMID.md).
