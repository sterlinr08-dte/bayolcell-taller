# 2026-10-22 11:00 · Claude · Lista de IMEI por almacén APAGADA

- **Dueño:** «sí, apágala». Antes, Dagoberto dijo «hay que agregar esos filtros» a `listaserie` (bitácora 2026-10-22-1040).
- **Edge `infoplus-imei-almacen` v6** desplegada:
  - con `LISTA_ACTIVA = false`, devuelve `imeis: []` sin llamar a Info Plus;
  - la ventana IMEI de la Prefactura vuelve a pedir que se escanee o escriba el IMEI, como antes de 20-oct.
- No se tocó el frontend.
- **Para prenderla:** cuando Info Plus dé los nombres de los filtros (artículo + almacén, solo series disponibles), se agregan a la URL, se pone `LISTA_ACTIVA = true`, se prueba con el 1906 (deben salir 2 en Oficina Santiago) y se despliega.
