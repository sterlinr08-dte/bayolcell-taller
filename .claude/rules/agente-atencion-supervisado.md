# Regla prioritaria — Agente de atención con aprendizaje supervisado

Aplica cuando se trabaje en WhatsApp, CRM, IA, `whatsapp-ia-responder`, sugerencias, conocimiento o automatización de atención de BAYOL CELL.

Antes de modificar el agente, leer completo:

`AGENTE_ATENCION_APRENDIZAJE_SUPERVISADO_2026-09-14.md`

## Reglas obligatorias

- La evolución comienza en `observacion`: **cero respuestas automáticas del agente**, incluido el saludo inicial.
- Comparar primero la función desplegada, la rama actual y cualquier avance existente. No sustituir una versión desplegada más nueva por una copia antigua del repositorio.
- La progresión es `observacion` → `copiloto` → `automatico` **por capacidad/intención evaluada**, no por tiempo transcurrido ni por cantidad global de chats.
- `activo=true` es solo un interruptor general; **no concede permiso de autoenvío**.
- En `observacion` y `copiloto`, el servidor debe impedir cualquier envío automático del agente. No confiar en instrucciones de prompt como control de seguridad.
- Un chat tomado por un empleado prevalece sobre cualquier automatismo.
- No llamar “aprendizaje” a acumular conversaciones. Solo incorporar conocimiento versionado y ejemplos/correcciones aprobados, con evaluación separada.
- No convertir automáticamente una respuesta humana, una venta o el silencio del cliente en evidencia de corrección.
- No reutilizar información privada entre clientes, líneas, sucursales o empresas.
- No habilitar autoenvío general hasta cumplir los criterios y pruebas de aceptación del documento principal y hasta que un administrador habilite la capacidad.
- Conservar la UI actual del CRM: una sola caja de escritura, controles de envío existentes, foco, scroll y comportamiento móvil/PC.
- En cada entrega indicar: archivos y migraciones, qué quedó implementado, qué quedó desplegado, modo efectivo por línea, pruebas ejecutadas y límites pendientes.

## Primera entrega exigida

La primera entrega verificable debe dejar al agente **solo observando y aprendiendo de forma supervisada**:

1. Los empleados continúan atendiendo normalmente.
2. El agente analiza y registra episodios/candidatos de conocimiento.
3. El responsable puede revisar qué información se propone incorporar.
4. Las pruebas demuestran cero llamadas de autoenvío del agente, incluso para saludos.

No avanzar silenciosamente a copiloto ni automático.
