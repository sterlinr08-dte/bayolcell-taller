# BAYOL DIAGNOSTIC ENGINE — Fase 2 (App de escritorio + Lector USB)

App de escritorio para Windows que lee el iPhone por USB **sin jailbreak**, saca
los datos (modelo, iOS, batería, voltaje, ciclos) y los **panic logs**
automáticamente, los analiza con la base de códigos de panic y los envía al motor
de **Diagnóstico IA** (el mismo de la Fase 1, dentro de Supabase).

Se conecta al **mismo Supabase** del taller y entra con el **mismo usuario** (ej.
`francis`). La seguridad es la misma: solo quien tenga el permiso de Diagnóstico
IA puede usar la IA.

---

## ¿Qué necesito en la PC del taller? (una sola vez)

### 1. Node.js
Descarga e instala **Node.js LTS** desde https://nodejs.org (botón verde de la izquierda).
Es lo que permite ejecutar y construir la app.

### 2. Driver de Apple
La PC debe poder "ver" el iPhone. La forma más fácil:
- Instala **iTunes** desde apple.com **o** el paquete *Apple Mobile Device Support*.
- Conecta el iPhone, desbloquéalo y toca **“Confiar”** cuando pregunte.

### 3. libimobiledevice (lo que lee el iPhone)
**Opción A — con scoop (recomendada, automática):**
1. Abre **PowerShell** y pega:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
   irm get.scoop.sh | iex
   scoop install libimobiledevice
   ```
2. Listo. La app lo detecta solo.

**Opción B — manual:** descarga un release de *libimobiledevice para Windows*,
y copia `idevice_id.exe`, `ideviceinfo.exe`, `idevicecrashreport.exe` (con sus
`.dll`) dentro de la carpeta `bde/bin/`.

> Si no instalas libimobiledevice, la app igual abre y puedes usar el
> **Modo demostración** y el **Diagnóstico IA** escribiendo los datos a mano.

---

## Cómo abrir la app (modo prueba)

Dentro de la carpeta `bde/`:
```bash
npm install
npm start
```
Se abre la ventana de BAYOL DIAGNOSTIC ENGINE. Entra con tu usuario (`francis`).

---

## Cómo crear el instalador .exe (para dejarlo fijo en la PC)

```bash
npm install
npm run dist
```
Cuando termine, el instalador queda en `bde/dist/` (ej.
`BAYOL Diagnostic Engine Setup x.x.x.exe`). Ejecútalo para instalar la app con
ícono en el escritorio. A partir de ahí se abre como cualquier programa.

---

## Cómo se usa en el taller

1. Conecta el iPhone por USB y desbloquéalo (toca **“Confiar”**).
2. Abre la app → **Lector de dispositivo** → **Leer dispositivo**.
3. En segundos aparecen: datos del equipo, batería con alertas y los panic logs.
4. Presiona **“Continuar al Diagnóstico IA”** → revisa/ajusta → **“Diagnosticar con IA”**.
5. Guarda el diagnóstico si quieres dejarlo en el historial.

---

## Seguridad
- La clave **publishable** de Supabase es pública por diseño (la misma del taller).
- La API key de Claude **NO** está en la app: vive solo como secreto en Supabase
  (Edge Function `bde-diagnostico`). La app nunca la ve.
- El acceso a la IA está protegido por RLS: solo usuarios con permiso
  `diagnostico_ver` (o admin).

---

## Cámara térmica (Fase 3 — incluida)
En el menú **🌡️ Cámara térmica**:
1. Conecta la cámara térmica por USB (la mayoría aparecen como una webcam).
2. Selecciónala en la lista → **Iniciar**. Verás la imagen en vivo.
3. **Capturar** (o **Subir imagen**) → **Analizar con IA**: detecta zonas
   calientes/frías, posibles cortos y PMIC recalentado, con la tabla de umbrales.
4. **Guardar captura**: queda en Supabase asociada al diagnóstico.

> Nota: las temperaturas exactas en °C dependen del software propio de cada
> cámara (FLIR/Qianli). Aun sin escala, la IA detecta las zonas calientes por
> color. La integración del SDK radiométrico se puede sumar después.

## Próximas fases
- **Fase 4:** microscopio + IA visual · **Fase 5:** esquemáticos ·
  **Fase 6:** base de conocimiento que aprende ·
  **Fase 7:** sensor INA226 (corriente en tiempo real).
