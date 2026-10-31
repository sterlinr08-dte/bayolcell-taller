# BAYOL CELL - Instalar impresion (31-oct-2026). Lo lanza bayol-impresion.bat como administrador.
# Solo texto ASCII a proposito: se descarga como texto y los acentos se pueden ver mal en la consola.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
function Paso($t)  { Write-Host ''; Write-Host "==> $t" -ForegroundColor Cyan }
function Ok($t)    { Write-Host "    OK: $t" -ForegroundColor Green }
function Aviso($t) { Write-Host "    OJO: $t" -ForegroundColor Yellow }
$base  = 'https://bayolcell.com/instalar'
$qzDir = Join-Path $env:ProgramFiles 'QZ Tray'
$qzExe = Join-Path $qzDir 'qz-tray.exe'
$errores = 0

Write-Host ''
Write-Host '  BAYOL CELL - Instalar impresion' -ForegroundColor White
Write-Host '  No cierre esta ventana hasta que diga LISTO.' -ForegroundColor Gray

# 1. QZ Tray (la ultima version estable, desde GitHub de QZ)
Paso 'QZ Tray'
if (Test-Path $qzExe) { Ok 'Ya estaba instalado.' } else {
  try {
    $rel   = Invoke-RestMethod 'https://api.github.com/repos/qzind/tray/releases/latest' -Headers @{ 'User-Agent' = 'bayolcell-instalador' }
    $arch  = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x86_64' }
    $asset = $rel.assets | Where-Object { $_.name -match '\.exe$' -and $_.name -match $arch } | Select-Object -First 1
    if (-not $asset) { $asset = $rel.assets | Where-Object { $_.name -match '\.exe$' } | Select-Object -First 1 }
    if (-not $asset) { throw 'No hay instalador .exe en la ultima version.' }
    $tmp = Join-Path $env:TEMP $asset.name
    Write-Host "    Descargando $($asset.name) ($($rel.tag_name))..."
    Invoke-WebRequest $asset.browser_download_url -OutFile $tmp -UseBasicParsing
    Write-Host '    Instalando (sin preguntas)...'
    Start-Process $tmp -ArgumentList '/S' -Wait
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  } catch { Aviso "No pude bajar QZ Tray: $($_.Exception.Message)" }
  if (Test-Path $qzExe) { Ok 'Instalado.' } else {
    $errores++
    Aviso 'QZ Tray no quedo instalado. Se abre la pagina oficial para bajarlo a mano.'
    Start-Process 'https://qz.io/download/'
  }
}

if (Test-Path $qzExe) {
  # 2. Certificado de BAYOL CELL como override.crt: QZ deja de preguntar "Permitir"
  Paso 'Certificado de BAYOL CELL'
  try {
    Invoke-WebRequest "$base/bayol-cell.crt" -OutFile (Join-Path $qzDir 'override.crt') -UseBasicParsing
    Ok 'Puesto. QZ Tray no volvera a preguntar "Permitir".'
  } catch { $errores++; Aviso "No pude poner el certificado: $($_.Exception.Message)" }

  # 3. Que abra solo con Windows (para todos los usuarios de la computadora)
  Paso 'Abrir con Windows'
  try {
    New-ItemProperty -Path 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'QZ Tray' -Value ('"' + $qzExe + '"') -PropertyType String -Force | Out-Null
    Ok 'QZ Tray abrira solo al encender la computadora.'
  } catch { Aviso "No pude dejarlo en el arranque: $($_.Exception.Message)" }

  # 4. Reiniciar QZ Tray sin permisos de administrador (para que lea el certificado)
  Paso 'Reiniciando QZ Tray'
  Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match '^qz-tray' } | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
  Start-Process explorer.exe -ArgumentList ('"' + $qzExe + '"')
  Ok 'Abierto (es la Q junto al reloj).'
}

# 5. Impresora de tickets como predeterminada (la usa Chrome cuando no hay QZ)
Paso 'Impresora de tickets'
try {
  $imps = @(Get-Printer -ErrorAction Stop | Select-Object -ExpandProperty Name)
  $tk = @($imps | Where-Object { $_ -match 'ticket|recibo|pos|80mm|58mm|xp-|xprinter|tm-|thermal|termica' -and $_ -notmatch '4barcode|4b-|label|2connect|lp427|pdf|xps|fax|onenote' })
  if ($tk.Count -eq 1) {
    Set-ItemProperty 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Windows' -Name 'LegacyDefaultPrinterMode' -Value 1 -ErrorAction SilentlyContinue
    (New-Object -ComObject WScript.Network).SetDefaultPrinter($tk[0])
    Ok "Predeterminada: $($tk[0])"
  } else {
    Aviso ('Impresoras en esta computadora: ' + ($imps -join ', '))
    Aviso 'No pude elegir una sola de tickets. Pongala como predeterminada en Windows (Configuracion > Impresoras).'
  }
} catch { Aviso "No pude revisar las impresoras: $($_.Exception.Message)" }

# 6. Acceso "Bayol Cell Caja": Chrome con impresion directa (sin la ventana de imprimir).
#    Usa un perfil aparte para que funcione aunque Chrome normal este abierto.
Paso 'Acceso "Bayol Cell Caja" en el escritorio'
$chrome = @(
  (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'),
  (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'),
  (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe')
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if ($chrome) {
  try {
    $perfil = 'C:\BayolCaja\chrome'
    New-Item -ItemType Directory -Force -Path $perfil | Out-Null
    & icacls 'C:\BayolCaja' /grant '*S-1-5-32-545:(OI)(CI)M' /T /Q | Out-Null
    $ws  = New-Object -ComObject WScript.Shell
    $lnk = $ws.CreateShortcut((Join-Path ([Environment]::GetFolderPath('CommonDesktopDirectory')) 'Bayol Cell Caja.lnk'))
    $lnk.TargetPath  = $chrome
    $lnk.Arguments   = '--kiosk-printing --user-data-dir="' + $perfil + '" --app=https://bayolcell.com/taller.html'
    $lnk.IconLocation = $chrome + ',0'
    $lnk.Description = 'BAYOL CELL - imprime directo, sin ventana'
    $lnk.Save()
    Ok 'Creado. Abra el sistema desde ese icono y la primera vez inicie sesion.'
  } catch { Aviso "No pude crear el acceso: $($_.Exception.Message)" }
} else { Aviso 'No encontre Google Chrome. Instalelo y vuelva a abrir este archivo.' }

Write-Host ''
if ($errores -eq 0) { Write-Host '  LISTO. Ya puede imprimir.' -ForegroundColor Green }
else { Write-Host '  LISTO con avisos (lea lo amarillo de arriba).' -ForegroundColor Yellow }
Write-Host '  En el sistema: Configuracion > Impresora se conecta sola.' -ForegroundColor Gray
