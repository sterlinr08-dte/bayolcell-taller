# 2026-10-12 — Claude · Pantallas Android: lote 1 aplicado en Info Plus (nivel 1)

Sigue a `2026-10-12-1450-claude-pantallas-android.md`.

## Autorización
El dueño devolvió el Excel `Pantallas_Android_precios.xlsx` con 123 precios en su columna «PRECIO FINAL (tú)» y escribió:
«ve publicando a clientes final nivel 1, los otros lo dejas igual» y «hasta que yo culmine».
Se entiende: aplicar por lotes lo que vaya llenando, solo el nivel 1; lo vacío y los niveles 2 y 3 no se tocan.

## Lote 1
- 123 filas con precio; 5 eran iguales al precio de hoy y no se enviaron. **118 cambios** (113 bajan, 5 suben).
- Se tomaron los precios del dueño tal cual, sin recalcular con la regla.
- 25 quedaron igual o por debajo del por mayor (nivel 2). El Excel ya se lo marcaba en «Aviso» y los dejó así.
- Lectura en vivo antes de aplicar: los 118 códigos siguen siendo la misma pantalla y el precio de hoy coincidía con el Excel.
- Aplicado con la herramienta de un solo uso `infoplus-precios-android-20261012` (lista fija, token de un solo uso guardado solo como hash): nivel 1 con contado = crédito = mínimo = precio nuevo. 118/118 respondieron OK.
- Verificación en vivo después: **117/118 coinciden.**
- **Pendiente: código 1818 (PANTALLA HTC 526).** No tenía nivel 1 en Info Plus y el API no crea un nivel que no existe. Hay que crearle el nivel 1 a mano en Info Plus (RD$1,000, lo que eligió el dueño).
- La herramienta quedó **retirada** (versión 3: responde 410, sin lógica). El token se borró.

## Hallazgo técnico
`GET /api/listaarticulos?...&detallado=true&todos=true` ahora devuelve `{status, message, data:[...]}` (antes era la lista suelta). Quien lo lea debe aceptar las dos formas. Trae 2,124 artículos.

## Próximos lotes
Cuando el dueño mande el Excel con más precios llenos: tomar solo las filas nuevas (que no estén en este lote), repetir lectura en vivo → aplicar → verificar con una herramienta nueva de un solo uso, y anotar aquí.
Los 118 códigos de este lote están en el commit de esta nota (lista fija de la función); no se ponen costos en el repo.
