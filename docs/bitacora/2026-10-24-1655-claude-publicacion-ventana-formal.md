# 24-oct-2026 16:55 RD · Publicado: ventana formal, sin modo de prueba, formulario en el clip y regla de orden (PR #118)

**Autorización:** dueño: «Publícalo».

## En vivo (`main`, squash `40caf7a`)
- Capa **f9** del formulario de financiamiento (`taller.html` u22): etiquetas en minúscula normal, casillas en fila dentro de
  tarjeta de 48 px, textos formales («Forma de envío», «Confirmo que informé al cliente el equipo y el precio.», «Enviar al
  cliente»), sin «Modo de prueba».
- «Solicitud de financiamiento» como opción del menú del clip 📎 del chat; en celular (≤ 768 px) solo ahí.
- `DESIGN.md §4b` y `REGLAMENTOS.md §4`: regla de orden de formularios y ventanas (igual en NEXUS y STUDIO, en sus ramas).
- Pruebas 390/1280 OK; CI verde. Suscripción al PR retirada y chequeo programado cancelado.

## Pendiente
- Dueño: pegar `docs/sql/PEGAR-ia-sin-fotos.sql` (la IA aún dice que se pide foto de la cédula).
- Dueño: elegir A/B/C para la lista «Solicitudes» en Financiamientos.
