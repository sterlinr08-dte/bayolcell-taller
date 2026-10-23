# REGLAMENTOS — BAYOL CELL (taller)

Reglas del dueño que el sistema debe cumplir siempre. Se agregan al final; nunca se borra una regla sin su OK.
La bitácora dice cuándo y por qué se escribió cada una.

## 1. Prefactura e IMEI (dueño, 22-oct-2026)

1. **Quién decide si un artículo lleva IMEI es Info Plus, no el nombre.** Un artículo pide IMEI si Info Plus tiene
   alguna serie registrada de ese código (en las compras sincronizadas o en la lista de series de cualquier almacén).
   La palabra «celular» en el nombre no basta. Solo si Info Plus no responde se decide por el nombre, como antes.
2. **Sin IMEI no se factura ni se prefactura un artículo con serie.** La cantidad de la línea es la cantidad de IMEI.
3. **Un IMEI escrito a mano tiene que existir en Info Plus**, estar en el almacén de la prefactura y ser de ese
   artículo. Si no, no entra y el sistema dice por qué (no existe, está en otro almacén, es de otro artículo).
   Los IMEI elegidos de la lista o encontrados por el buscador ya vienen comprobados.
4. **Con el IMEI completo se encuentra el artículo** (buscador «Buscar o escanear»): al agregarlo, el IMEI queda en su línea.
5. **Nunca se muestra un IMEI de otro almacén** en la lista «IMEI en <almacén>»; si Info Plus no cuadra con la
   existencia, la lista sale vacía y se escanea o escribe.

## 2. Descuentos en la prefactura (dueño, 22-oct-2026)

1. El descuento **por línea es en por ciento** y tiene un **tope** que se pone en Configuración → Datos del taller
   («Descuento máximo en la prefactura (%)»). Si no se pone, es **10 %**.
2. Hay además un **descuento en pesos (RD$) sobre toda la prefactura**. Va a Info Plus en la cabecera: `descuento`
   es un **por ciento** sobre el subtotal (comprobado con la prefactura 118930: 500 se tomó como 500 %). Info Plus
   **tampoco aplica el % de cada línea** (2.ª prueba, 22-oct). Por eso TODO el descuento (líneas + pesos) se manda a la
   cabecera como un solo % y las líneas van con porcentaje 0; `descuentototal` lleva los pesos totales. En Info Plus
   sale como «Descuento %». El % por línea y los RD$ son solo la forma de escribirlo en el taller.
3. Líneas + pesos **no pueden pasar del tope** (% del subtotal). El sistema recorta y avisa cuánto queda disponible.
4. **Al modificar una prefactura ya enviada, Info Plus no cambia la cabecera**: ni el descuento ni el comentario
   (comprobado con la 118931 y la 118932, 22-oct). Si hay que cambiar descuento o comentario, se anula en Info Plus y se
   crea una nueva, hasta que Dagoberto lo arregle.

## 3. Comentario de la prefactura (22-oct-2026)

- El comentario se guarda en el taller, sale al imprimir y se manda a Info Plus en `comentario` (campo «Comentario»
  de la prefactura; comprobado por el dueño con la 118932). `contrato` va vacío.
- **Toda prefactura del taller lleva el comentario fijo «bayolcell.com:»** seguido de lo que se escriba (dueño, 22-oct),
  para identificar en Info Plus que se hizo desde el taller.
- Cliente de contado (cód. 1): el nombre va como «CONTADO <nombre>». La API solo toma `nombre`; cédula y teléfono
  no llegan (probado 22-oct). Pedir a Dagoberto los campos si se necesitan.

## 4. Redacción de avisos y textos (dueño, 22-oct-2026)

- Avisos **cortos, profesionales y que informen**, sin redundancias ni instrucciones de más. Una o dos frases.
  Ejemplo aprobado: «Esta prefactura no se modificará en Info Plus. Los cambios quedan solo en este sistema.»

## 5. Reglas generales que ya regían

- Datos de Bayol salen solo de su Info Plus; escribir en Info Plus exige autorización expresa del dueño.
- Publicar a `main` solo con «publícalo» (vale para esa entrega). Secretos nunca en el repo, el chat ni la bitácora.
- Todo lo que se toca mide ≥44 px; campos 48 px con letra 16 px; se mide con Playwright a 390 y 1280 px.
