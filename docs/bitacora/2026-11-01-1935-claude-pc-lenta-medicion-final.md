# PC de bajos recursos — medición final, antes vs hoy (1-nov-2026)

**Pedido del dueño:** «Mide ahora».

**Método:** mismo banco local (servidor gzip), Chrome con CPU 6× más lenta, Recepción con prefactura, 3 corridas, mediana. «Antes» = `main` en `c083442` (antes de las 6 fases). «Hoy» = `main` en `b9ec592`.

| Medida (modo normal) | Antes | Hoy |
|---|---:|---:|
| Una tecla en Recepción | 137 ms | 73 ms |
| Trabajo de estilos en 20 teclas | 870 ms | 413 ms |
| Cambiar 5 pantallas | 482 ms | 492 ms (igual) |
| Pintado en 5 pasos de scroll+tecla | 89 ms | 77 ms |
| Arranque (load) | 1.8 s | 1.6 s (igual) |

Modo ligero: tecla 108 → 76 ms; estilos 901 → 566 ms. En este banco (sin GPU, sin animaciones corriendo) el modo ligero no se distingue del normal en teclado; su ganancia está en pintado y animaciones, que esta prueba casi no ejercita.

**Lectura:** lo que más sentía el dueño (escribir) bajó a la mitad. Cambiar de pantalla y arrancar no cambiaron: eso es el tamaño del taller (fase 7, en espera por decisión del dueño).

Sin cambios de código. Scripts de medición en el scratchpad de la sesión (`mide-final.cjs`), no en el repo.
