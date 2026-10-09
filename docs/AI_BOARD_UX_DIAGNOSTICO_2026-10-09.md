# AI BOARD - Diseno UX de Diagnostico v1
Fecha: 2026-10-09
Estado: especificacion de interfaz, no implementado
Rama: feature/ai-board-plan-iphone-x-plus

## Principios
Identidad BAYOL CELL rojo #E31E24, blanco, grises neutros. Estetica original inspirada en claridad, jerarquia, superficies y gestos de Apple HIG, sin suplantar Apple. Sin iconos decorativos ni botones sin accion. Estados de carga, vacio y error. Navegacion persistente a vista y orden actual. A11y AA, areas tactiles >=44 px, movimiento reducido.

## Estructura de Diagnostico
Una sola vista nav('diagnostico'); encabezado contextual con Orden #, modelo, revision de placa y estado.
Pestanas: BITMAP, Diagnostico IA, Chats, Biblioteca. En escritorio BITMAP y Diagnostico IA pueden mostrarse a la vez en paneles; pestanas cambian foco, no duplican chats.
Search global tecnico: modelos, componentes, net, medicion, sintomas, casos, fuentes.

## Desktop
Panel navegacion existente (no duplicar).
Area principal 65-75%: visor de placa con barra superior [modelo, revision, lado, modo foto/boardview, estado fuente], barra flotante izquierda [seleccionar, mano, buscar, capas, medir, comparar, zoom, pantalla completa]. Minimap inferior, escala, coordenadas, indicacion de cobertura. Zoom con rueda/trackpad y botones; gesto pinza cuando tactil; centrar en componente; limite por resolucion real de imagen. Overlays vectoriales siempre nitidos.
Panel derecho 25-35%: tarjetas acoplables Diagnostico IA / Chat equipo / Punto seleccionado y mediciones / fuentes; ancho redimensionable, no pop-ups invasivos.
Bloque fijo inferior: caja de mensaje, microfono, adjuntar foto/archivo, boton enviar; streaming e indicador de error.

## Movil
Header compacto con volver (conserva vista), modelo y orden. Toolbar inferior [Placa, IA, Chats, Medidas] y Biblioteca en Mas o pestana secundaria; visor a pantalla completa; panel inferior deslizable con altura pequena, media y expandida. Ocultar teclado restaura posicion y foco; no anidar modales. Zoom gesto de pinza, arrastrar con uno/dos dedos segun herramienta. Sin scroll horizontal global.

## Visor HD
Motor tile multiresolucion (piramide) para fotografias validadas, con fallback 'sin imagen de alta resolucion'; NO prometer nitidez infinita: si los pixeles originales no alcanzan no se pueden recuperar detalles. SVG/Canvas vectorial para boardview, con niveles de detalle y etiquetas segun escala. Minimap, coordenadas estables y conversion exacta entre fotografia y boardview calibrada por puntos de referencia. Cache por limites de memoria, cancelacion de tiles fuera de vista, render progresivo y prefetch discreto.
Capas: foto, geometria PCB, designadores, pines, redes, puntos de prueba, mediciones, anotaciones. Cada capa con indicador de fuente, revision y cobertura; prohibir pines y conexiones ficticios.
Seleccion de objeto -> panel Datos: designador, tipo, net, pines, ubicacion, referencias de medida, documentacion, procedencia y estado de validacion. Link 'Compartir punto' inserta deep-link interno seguro al chat/caso.

## IA y mensajes
Chat IA no publica resultados en chats humanos automaticamente. Casos guardan sintomas, mediciones con unidades/condiciones, fotos y fuentes. IA produce 'evidencia', 'hipotesis' y 'siguiente prueba' bien diferenciados; no dicta voltajes inventados ni cambios de componentes sin validacion.
Chat humano: uno a uno, grupos, compartir mensaje/foto/voz/archivo, responder, editar/eliminar con auditoria, leer y no leidos, buscador. Consultar IA desde chat solicita alcance de los mensajes a compartir antes de llamarla. Realtime y control de acceso a nivel servidor.

## Pantallas y estados verificables
A. Sin orden: catalogo modelos y boton Iniciar diagnostico.
B. Orden vinculada: cabecera con Orden, cliente minimizado, modelo/revision, sintomas, estado y tecnico.
C. Modelo sin boardview: mensaje honesto 'No hay mapa validado', permitir foto/manual/chat sin dibujar nets.
D. BITMAP listo: capas validas visibles, zoom y componente seleccionado.
E. Chat IA vacio, respondiendo, error, reintentar.
F. Chat humano sin conversaciones, sin permiso, sin red, adjunto fallido.
G. Medicion fuera de rango: alertar SOLO si referencia y condiciones realmente son equivalentes.
H. Caso cerrado: resumen revisable, tecnico validador, pruebas finales y publicar biblioteca con aprobacion.

## Flujo < 5 toques cuando hay orden
Abrir orden > Diagnostico > elegir sintoma > abrir caso y BITMAP (modelo precargado).
Luego seleccionar punto > registrar medicion > siguiente prueba sugerida. Guardar automatico con confirmacion visible, sin ocultar fallos de red.

## Reglas de estilo
Tipografia sistema con 14-16px minimo para informacion operativa, 12px solo metadatos; espaciado multiples de 4/8px; radio 10-16px; boton primario rojo exclusivamente acciones clave; azul/gris neutro para seleccion secundaria; estados por icono y texto, nunca solo color; sombras tenues y blur limitado para rendimiento en movil. Respetar estilo del modulo Diagnostico sin modificar CRM ni otras vistas.

## Criterios de aceptacion UX
1. Un tecnico encuentra modelo/componente con teclado, ratón o tactil.
2. Zoom de imagen depende de calidad real y nunca se declara ilimitado.
3. Pan/zoom en movil no mueve resto de pagina ni provoca saltos.
4. Cada nombre de net/medicion se identifica por fuente y revision.
5. Chats humanos e IA separados, compartir contexto opt-in.
6. Restaurar pestaña, zoom/seleccion del caso y scroll despues de refrescar.
7. Abrir Diagnostico no ralentiza vistas externas; recursos pesados lazy-load.
8. Pantallas de error y de datos faltantes claramente visibles.
9. UI revisada en resoluciones movil/tablet/desktop y voz/teclado.
10. No integrar/publicar sin revision, pruebas y autorizacion.

## Proximas tareas
Auditar codigo actual exacto de vista diagnostico y dependencias; bosquejos de interfaz desktop/movil; prototipo interactivo aislado; diseno del modelo de datos/RLS y API; integracion en rama; pruebas.
Referencias: https://developer.apple.com/design/human-interface-guidelines/ ; https://openseadragon.github.io/ ; https://supabase.com/docs/guides/auth/row-level-security
