# Prefactura: icono de impresora en la cabecera para que los empleados configuren la impresora

**Dueño:** «Habilitar un icono para poder configurar la impresora porque los empleados no tienen acceso.»

## Cambio (taller-prefactura.js i21)
Junto a la lupa de la cabecera de la Prefactura hay un botón **🖨 Configurar impresora** (44 × 44) que abre Configuración → Impresora
(`nav('configImpresora')`). El permiso `config_impresora` ya es libre para toda sesión desde p32, así que funciona para técnicos y
empleados aunque no vean el menú de Configuración.

## Prueba (banco local, sesión de técnico sin permisos)
Botón de 44 × 44; al tocarlo se abre `v-configImpresora` con el título «Config. Impresora»; sin errores de JS.

## Publicación
Directo a `main`.
