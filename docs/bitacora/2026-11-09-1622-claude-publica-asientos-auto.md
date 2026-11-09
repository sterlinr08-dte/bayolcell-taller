# Publicado (escondido): asientos automáticos de nómina y pagos (PR #274)

- El dueño tocó «Publícalo».
- Se unió el PR #274 (squash `ab130e9`).
- Comprobado con curl: bayolcell.com/taller.html carga `conta-asientos-auto.js?v=20261109-aa1` (respuesta 200).
- Sigue apagado para todos. Se enciende por navegador con `localStorage.setItem('bc_asientos_auto','1')` y se apaga con `localStorage.removeItem('bc_asientos_auto')`.
- Falta: probarlo con una nómina real, poner el Departamento (tienda) a los empleados en RRHH y que la contadora lo revise.
