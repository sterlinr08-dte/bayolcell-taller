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

6. **Vendedor y almacén fijos por empleada.** El Vendedor de la prefactura es el código de empleado de Info Plus de
   quien está conectada (`tecnicos.infoplus_codempleado`: Michelle 748, Kenifer 1020, Yosmeiry 1192, Loribel 249) y
   queda bloqueado; el Almacén es el de su sucursal, también bloqueado. Solo el administrador puede cambiarlos.
   Una empleada sin código ve un aviso «usuario no enlazado» y el administrador le asigna el código en su ficha.

7. **Enviar la prefactura por WhatsApp** (dueño, 22-oct-2026): botón «Enviar por WhatsApp», nunca automático. Sale por la
   línea de la sucursal del almacén: Santiago → Reparación, Navarrete → Principal, Moca → Reparación; cliente mayorista →
   «Al por Mayor» donde exista. Si el cliente escribió en las últimas 24 h, va el texto con el PDF; si no, va la plantilla
   aprobada por Meta «bayolcell_prefactura». El mensaje queda en el chat del CRM de esa línea.
8. **El cliente se guarda por su número de WhatsApp** (tabla `clientes`), sin importar la sucursal, y cada prefactura queda
   ligada a él (`cliente_id`). Su historial de compras se ve en la ficha del cliente, pestaña «Compras».
9. La lista «Prefacturas realizadas» no va en la pantalla de Prefactura (dueño, 22-oct). Para reabrir una, la píldora
   «Prefacturas» o la ficha del cliente.

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

- El comentario se guarda en el taller, sale al imprimir y se manda a Info Plus **en los dos campos, `contrato` y
  `comentario`**, con el mismo texto (23-oct-2026: al quitar `contrato` dejó de salir en la Factura; el dueño confirmó el
  24-oct que con los dos vuelve a salir). No volver a dejar `contrato` vacío.
- **Toda prefactura del taller lleva el comentario fijo «bayolcell.com:»** seguido de lo que se escriba (dueño, 22-oct),
  para identificar en Info Plus que se hizo desde el taller.
- Cliente de contado (cód. 1): el nombre va como «CONTADO <nombre>». La API solo toma `nombre`; cédula y teléfono
  no llegan (probado 22-oct). Pedir a Dagoberto los campos si se necesitan.

## 4. Redacción de avisos y textos (dueño, 22-oct-2026)

- Avisos **cortos, profesionales y que informen**, sin redundancias ni instrucciones de más. Una o dos frases.
  Ejemplo aprobado: «Esta prefactura no se modificará en Info Plus. Los cambios quedan solo en este sistema.»

- **Orden de formularios y ventanas (24-oct-2026):** etiquetas en minúscula normal (nunca MAYÚSCULAS), textos formales y
  cortos en usted sin paréntesis explicativos, casillas en fila con su texto dentro de una tarjeta de 48 px, campos 48/16 px,
  botón principal 54 px. Detalle en `DESIGN.md §4b` (igual en los 3 proyectos). Se aplica a toda ventana nueva y a las
  existentes cuando se toquen.

## 5. Reglas generales que ya regían

- Datos de Bayol salen solo de su Info Plus; escribir en Info Plus exige autorización expresa del dueño.
- Publicar a `main` solo con «publícalo» (vale para esa entrega). Secretos nunca en el repo, el chat ni la bitácora.
- Todo lo que se toca mide ≥44 px; campos 48 px con letra 16 px; se mide con Playwright a 390 y 1280 px.
