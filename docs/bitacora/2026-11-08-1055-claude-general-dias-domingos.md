# General: «debe vender por día» cuenta los domingos de Navarrete (08-nov-2026, 10:55 RD)

- Pregunta abierta en la bitácora `2026-11-08-1040`. El dueño eligió la **B**: un solo criterio, con los domingos de Navarrete.
- `conta-equilibrio.js`, pestaña General: «Debe vender en el mes … por día» ahora divide entre los días que abre alguna tienda (los de Navarrete, con domingos), igual que «Le falta por día que queda». Texto: «por día (incluye domingos)». Se quitó la cuenta aparte de lunes a sábado.
- Única cifra que cambia: el «por día» de esa tarjeta en la General. En noviembre 2026 (30 días en lugar de 25) baja de unos RD$ 90,256 a unos RD$ 75,213 con los datos de prueba.
- Comparación automática con 7 fechas y 3 meses: solo cambian ese número y su texto (42 campos = 2 campos × 21 casos). Nada más se mueve. Las tiendas no cambian.
- Va en la rama `claude/equilibrio-dias`, junto con el paso 2. No publicado.
