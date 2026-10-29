# Raspa y gana: diseño elegido, a qué aplica el premio y qué se regala

## Decisiones del dueño (29-oct-2026)
- Le gustó el **diseño 2**, el de la hoja impresa con cupón para recortar y zona para raspar.
- Pidió organizar a qué se aplica el 10 % y qué accesorios son gratis. Con los datos reales eligió:

| Lo que se vende (categoría de Info Plus) | Premio máximo |
|---|---|
| ACCESORIOS (forros, láminas, cristales, cables) | 10 % |
| Baterías (dentro de PIEZAS) | 10 % |
| Servicio técnico (TALLER, código 1121) | 10 % |
| Pantallas (dentro de PIEZAS) | **5 %**, aunque el premio sea de 10 % |
| MOBILES (celulares), TV, pasolas y aires | No aplica |
| Cargadores VIDVIE (1539, 1540 y 1541) | No aplica (ganan muy poco) |
| Envío o mensajería (1161), recarga (1186) y Turbo SIM | No aplica |

**Accesorio gratis:** templado cristal variado (código 1582) o cable USB tipo C Samsung (código 1021).

## Fuente de verdad
Tabla `infoplus_ventas` del taller, últimos 180 días, por categoría.

| Categoría | Ganancia de cada RD$100 vendidos |
|---|---|
| MOBILES | RD$16 |
| PIEZAS | RD$45 |
| TALLER | RD$98 |
| ACCESORIOS | RD$59 |

Ejemplos por artículo:
- Pantallas iPhone Incell: unos RD$27–35 de cada RD$100. Ejemplo: la 1085 se vende en RD$1,098 y cuesta RD$801.
- Cargadores VIDVIE: unos RD$10. Ejemplo: el 1539 se vende en RD$151 y cuesta RD$136.
- Templado 1582: se vende en RD$119 y cuesta RD$15.
- Cable 1021: se vende en RD$156 y cuesta RD$25.

## Maqueta
- El diseño 2 se actualizó con esas reglas y con artículos reales de ejemplo.
- Está en el mismo enlace: https://claude.ai/artifact/5jUEC6V3o1Erne5fDufmi4
- Pruebas con Playwright a 390 y 1280 px: sin scroll horizontal y sin errores.

## Pendiente
- Al construirlo, separar pantallas y baterías dentro de PIEZAS. Info Plus no tiene subcategoría: se haría por la descripción («PANTALLA», «BATERIA») o con una lista de códigos que el dueño apruebe.
- Falta el OK del dueño al reparto (80 / 15 / 5) y al tope de 3 accesorios gratis por día.
- Falta la orden de construir, en una rama y sin publicar.
