# 25-Nov-2026 07:28 (RD) — Claude — Info Plus: formato confirmado del AJUSTE con IMEI (Dagoberto)

## Qué llegó
El dueño reenvió la respuesta de Dagoberto (Info Plus): «Con este JSON funciona».

```json
{
  "codajuste": "", "fecha": "2026-6-25", "hora": "10:00:00", "total": 1, "cancelado": false,
  "codempleado": "6", "comentario": "Prueba entrada con IMEI",
  "codminventario": 1, "codlocalidad": 1, "codcatalogo": "62809",
  "subsidio": false, "esmaterialgastable": false,
  "codcentrocosto": null, "codactivofijo": null, "codotrascompras": null,
  "detallesajuste": [
    { "codarticulo": 3082, "precio": 1, "cantidad": 1, "codunidad": 1, "movimiento": 1,
      "fvencimiento": "2026-6-25", "caracteristicas": "" }
  ],
  "detallesajuste2": [],
  "seriales": [{ "numero": "351829689413208", "codarticulo": 3082 }]
}
```

Reglas que da Dagoberto:
- `fvencimiento` = la misma fecha del ajuste.
- En `seriales` va **también el código del artículo**: `{ "numero": "<IMEI>", "codarticulo": <código> }`.

## Qué corrige
- `CLAUDE.md` (25 jun 2026) decía que `seriales` era una lista de textos (`["3518…"]`) y que los ajustes de artículos con serial «no guardan» (se quedaba pegado en `AI00000641`). Con el formato de Dagoberto sí guarda. **Esa nota queda superada por esta entrada.**
- Es el mismo formato `{numero, codarticulo}` que ya usan, y que funcionan:
  - la compra (`taller-app.js`, armado de `detallescompra` + `seriales`);
  - el despacho (`_ejecutarDespachoReal`).

## Estado del código
- `_infoplusAjustePieza` (`taller-app.js`) siempre manda `seriales: []`, así que hoy ningún ajuste del taller lleva IMEI.
- No se cambió código.
- No se escribió nada en Info Plus: no se hizo ninguna prueba propia, solo se toma el ejemplo de Dagoberto.

## Siguiente paso
- El dueño decide para qué usarlo; se le dieron opciones.
- Toda escritura en Info Plus necesita su autorización expresa.
