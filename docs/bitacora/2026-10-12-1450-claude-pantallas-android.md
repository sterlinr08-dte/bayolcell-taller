# 2026-10-12 14:50 — Claude · Pantallas Android: propuesta de precios nivel 1 (Info Plus) — EN REVISIÓN DEL DUEÑO

Nota para que cualquier chat del taller sepa en qué va esto. Se escribió desde el chat de NEXUS PRO, donde se hizo el trabajo, a pedido del dueño: «Guarda lo que hicimos en el taller para que el otro chat sepa».

## Relación con lo anterior
1. **Pantallas iPhone Incell — HECHO.** El 8 de octubre se aplicaron en Info Plus, nivel 1, los precios de 24 artículos y se verificaron. El detalle está en `CLAUDE.md`, en «ACTUALIZACIÓN 8 oct 2026 — Precios de pantallas Incell…».
2. **Flyer «Pantallas desde RD$1,000» — PUBLICADO** en bayolcell.com. Esa frase vale para iPhone Incell y para Android.
3. **Pantallas Android — ESTE PASO.** Muchos modelos viejos tienen el precio de nivel 1 muy alto. El dueño pidió bajarlos con una regla fija para que la oferta «desde RD$1,000» sea verdad también en Android.

## Regla del dueño (9 de octubre de 2026)
Todo en números redondos:
- **Muy viejos (hasta 2018):** RD$1,000. Si el por mayor (nivel 2) pasa de 600, RD$1,200.
- **Menos viejos (2019–2020):** RD$1,500.
- **Recientes (2021 en adelante), según el por mayor:**
  - por mayor hasta 800: RD$1,800;
  - de 801 a 1,000: RD$2,000;
  - más de 1,000: RD$2,000 en adelante. Si el precio de hoy ya es mayor, se deja redondeado.
- El **año** lo dedujo la IA por el nombre del modelo y **puede fallar**. El dueño puede mover un modelo de grupo.

## Lo que se preparó (9 de octubre)
Se leyeron en vivo de Info Plus 358 pantallas Android.

| Grupo | Artículos | Bajan | Suben | Iguales | Avisos |
|---|---:|---:|---:|---:|---|
| Muy viejo (hasta 2018) | 75 | 69 | 5 | 1 | 26 con «≤ POR MAYOR», 35 con «MARGEN FINO», 5 con «COSTO 0» |
| Menos viejo (2019–2020) | 91 | 90 | 0 | 1 | 12 con «≤ POR MAYOR», 15 con «MARGEN FINO» |
| Reciente (2021 en adelante) | 163 | 92 | 4 | 67 | 1 con «MARGEN FINO» |
| Sin año | 29 | — | — | — | sin propuesta: el dueño debe decir a qué grupo van |

Qué significa cada aviso:
- **SUBE:** la regla da un precio mayor que el de hoy.
- **≤ POR MAYOR:** el precio nuevo quedaría igual o por debajo del nivel 2. Hay que subirlo o bajar el nivel 2.
- **MARGEN FINO:** el precio nuevo es menor que 1.5 veces el costo.
- **COSTO 0:** el costo está mal cargado en Info Plus.

## Estado hoy (12 de octubre)
- **No se ha cambiado nada en Info Plus.**
- El dueño tiene el Excel **`Pantallas_Android_precios.xlsx`**:
  - hoja «Pantallas Android»: código, pantalla, año, precio de hoy, por mayor, costo, unidades, precio nuevo y avisos;
  - hoja «Resumen».
- Hoy se le volvió a mandar para que **corrija los precios a mano** y lo devuelva.
- **El Excel no está en el repo.** Este repo es público y el archivo trae costos. Si otro chat lo necesita, que se lo pida al dueño. Tampoco poner costos en esta bitácora.

## Cómo seguir cuando el dueño devuelva el Excel
1. Leer **su** columna de precio nuevo. Él manda: no recalcular con la regla encima de lo que corrigió.
2. **Volver a leer en vivo** cada artículo en Info Plus (`listaarticulos … detallado=true&todos=true`). Comprobar que el código siga siendo esa pantalla; ver el hallazgo del código 1500 en `CLAUDE.md`.
3. Mostrarle la tabla **precio de hoy → precio nuevo**, solo con lo que cambia, y señalar los que queden por debajo del por mayor.
4. Aplicar **solo con su OK por escrito**, igual que con Incell:
   - solo el **nivel 1**, con contado = crédito = mínimo = precio nuevo;
   - no tocar los niveles 2 y 3, ni las OLED, ni micas, glass o bisel;
   - herramienta de un solo uso con la lista fija, como `infoplus-precios-pantallas-20261009`;
   - verificar el 100 % después.
5. Dejar una bitácora y actualizar `CLAUDE.md`.

## Archivos
- Solo esta bitácora (documentación). No cambia la app, la base ni Info Plus.
