# Publicación «Comenta PANTALLA» — Bayol Cell

Idea 2 del dueño (14-oct-2026): publicaciones que invitan a comentar. La imagen **no** muestra la lista completa;
el precio se manda por privado cuando la persona comenta. Así sube el alcance (comentarios) y cada comentario
se vuelve una conversación en el CRM.

- Imagen: `out/post-comenta-feed.jpg` (1080×1350, feed de Instagram/Facebook) y `out/post-comenta-story.jpg` (1080×1920).
- Volver a generarla: `NODE_PATH=$(npm root -g) node render.js` (o `render.js feed` / `render.js story`).
- Precio «desde RD$1,000» = el más bajo del nivel 1 aprobado (7 / 8). Solo nivel 1 en lo público.

## Texto de la publicación (pie de foto)

> ¿Se te rompió la pantalla del iPhone? 📱💥
> Comenta **PANTALLA** + tu modelo (ej.: *PANTALLA 13 Pro*) y te mandamos el precio por privado al instante.
>
> ✅ Instalación incluida
> ✅ Lista en 30 minutos
> 📍 Santiago · Moca · Navarrete
>
> #BayolCell #PantallaiPhone #ReparaciónDeCelulares #Santiago #Moca #Navarrete #RepúblicaDominicana

## Otras dos ideas con la misma regla (palabra «pantalla»)

1. **«¿Cuál se te rompió?»** — carrusel con 3 fotos de pantallas rotas (reales del taller) → «Comenta PANTALLA y el modelo».
2. **«Adivina el precio»** — «¿Cuánto crees que cuesta la pantalla de un iPhone 11 con instalación? Comenta tu número 👇
   El que más se acerque gana un protector. ¿Quieres el precio del tuyo? Comenta PANTALLA».
   (El concurso necesita el OK del dueño y sus bases.)

## Respuesta automática (ya creada en el CRM, **apagada**)

Tabla `social_automatizaciones`, 2 reglas «Comenta PANTALLA (precio de pantalla)» (Instagram y Facebook):
- palabra: `pantalla` (contiene), últimas publicaciones, enfriamiento 24 h por persona;
- respuesta pública: «¡Te escribimos por privado! 📩»;
- mensaje privado: «¡Hola {nombre}! 👋 Gracias por comentar. Dime el modelo exacto de tu celular y te digo el precio
  de la pantalla con instalación incluida. También puedes ver los precios aquí: https://bayolcell.com/tienda.html#pantallas
  — Estamos en Santiago, Moca y Navarrete.»
- La activa el administrador en CRM › Automatizaciones **cuando el post ya esté publicado**.
