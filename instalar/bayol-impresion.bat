@echo off
rem ============================================================
rem  BAYOL CELL - Instalar impresion (31-oct-2026)
rem  Doble clic. Windows pide permiso: toque "Si".
rem  Instala QZ Tray, pone el certificado de BAYOL CELL (no vuelve
rem  a preguntar "Permitir"), lo deja abriendo con Windows y crea el
rem  acceso "Bayol Cell Caja" en el escritorio.
rem ============================================================
title BAYOL CELL - Instalar impresion
net session >nul 2>&1
if errorlevel 1 (
  echo Pidiendo permiso de administrador...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $s=(New-Object Net.WebClient).DownloadString('https://bayolcell.com/instalar/bayol-impresion.ps1'); Invoke-Expression $s"
echo.
pause
