# 2026-10-17 08:52 — Claude · Reel «Gran Rifa 50K» versión 2 (borrador, sin publicar)

## Pedido del dueño
- «Haz la versión 2 del reel de la rifa», siguiendo el informe del panel de 100 agentes (`2026-10-17-0256-claude-reel-rifa-50k.md`).
- El dueño no contestó las preguntas sobre la fecha, el TV, el boleto y el sorteo. Se usaron valores prudentes, **marcados para confirmar**:
  - fecha tope: 23 de diciembre;
  - TV: «Smart TV», sin pulgadas;
  - boleto: «1 compra = 1 boleto», tomado de la letra pequeña de la urna;
  - sorteo: «en vivo desde la tienda» y «nunca te pediremos dinero».

## Qué se hizo (HyperFrames 0.8.168, telemetría apagada, encima del video original sin volver a grabar)
- **Gancho, 0 a 1.9 s:** el volante de la pasola con la voz «Puedes ganar una pasola eléctrica» y el texto «¡GRAN RIFA! Gánate uno de estos 3 premios». Después sigue el reel original completo.
- **Contador:** la píldora «META: 50 MIL SEGUIDORES» aclara que la meta no se ha cumplido.
- **Ortografía:** se taparon «Particpiar» y «Es muy facil» con «Participar» y «Es muy fácil».
- **TV:** «SMART TV DE 55 PULG.» pasa a «SMART TV». La caja del dibujo del volante sigue diciendo 55": no se puede quitar sin rehacer el volante.
- **Condición con fecha** mientras ella la dice: «Rifa al llegar a 50 mil seguidores · o, a más tardar, el 23 de diciembre».
- **Final:** el volante denso de 4 s se cambió por 2 tarjetas (3 s cada una), con los textos en la mitad de arriba, fuera de la zona que tapa Instagram:
  - «Cómo participar»: compra = boleto (equipo, accesorio o reparación), las 3 tiendas y @bayolcell;
  - «¿Cuándo es la rifa?»: fecha, sorteo en vivo, nunca te pediremos dinero y el llamado a mandar el video.
- **Audio:** se bajó el volumen.

## Pruebas
- `hyperframes check`: aprobado.
  - 0 errores;
  - 6 avisos de estructura (sugiere subcomposiciones; sin efecto en el video);
  - contraste 15/15 AA;
  - diseño sin problemas.
- Capturas en 8 momentos, revisadas una por una.
- Se transcribió el inicio: arranca limpio con «Puedes ganar una pasola eléctrica» y luego «Estamos celebrando…».
- Volumen: −13.8 LUFS con pico −2.1 dBFS. El original estaba en −8.6 LUFS y +1.8, recortado.

## Archivos (fuera del repo)
- Video: `scratchpad/rifa-v2/rifa-50k-v2.mp4`, 31.4 s, 1080×1920.
- Copia liviana para el celular: `rifa-50k-v2-celular.mp4`, 23 MB.
- Proyecto: `scratchpad/rifa-v2/proyecto/index.html`.

## Pendientes
- El dueño debe confirmar la fecha, el TV real, la regla del boleto y cómo será el sorteo. Cada cambio es una línea.
- Siguen en la imagen original, porque no se pueden quitar sin rehacerla:
  - los destellos y el confeti;
  - el «55"» de la caja del dibujo.
- Antes de pautar: revisar con un abogado las bases, el registro y el permiso.
- No se publicó nada.
