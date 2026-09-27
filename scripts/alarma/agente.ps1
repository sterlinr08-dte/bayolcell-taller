# Agente de alarma BayolCell - escucha los DVR Dahua de la red local y avisa al
# sistema (Edge Function alarma-agente) cuando hay movimiento/persona en una
# camara vigilada mientras la alarma esta armada. El horario lo pone el admin en
# el sistema del taller; el servidor decide si esta armada (hora de RD).
#
#   agente.ps1            -> supervisor: arranca/reinicia un escucha por DVR
#   agente.ps1 -DvrId X   -> escucha de un DVR (lo lanza el supervisor)
#
# Credenciales (cifradas con DPAPI, solo este usuario de Windows):
#   %USERPROFILE%\alarma_agente.cred     token del agente
#   %USERPROFILE%\dvr_<ip>.cred          usuario/clave de ese DVR (si no existe, dvr_dahua.cred)
param([string]$DvrId)
$ErrorActionPreference = 'Stop'
$Dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Url = 'https://vkhwdvjtowrhkhqavnvk.supabase.co/functions/v1/alarma-agente'
$Token = (Import-Clixml "$env:USERPROFILE\alarma_agente.cred").GetNetworkCredential().Password

function Log([string]$m) {
  $f = Join-Path $Dir "agente$(if($DvrId){'_' + $DvrId.Substring(0,8)}).log"
  if ((Test-Path $f) -and (Get-Item $f).Length -gt 2MB) { Move-Item $f "$f.1" -Force }
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $m" | Add-Content $f -Encoding utf8
}
function Api($body) {
  $json = $body | ConvertTo-Json -Depth 8 -Compress
  Invoke-RestMethod $Url -Method Post -Headers @{ 'x-agente-token' = $Token } -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($json)) -TimeoutSec 30
}
function CredDvr([string]$ip) {
  $f = "$env:USERPROFILE\dvr_$ip.cred"; if (-not (Test-Path $f)) { $f = "$env:USERPROFILE\dvr_dahua.cred" }
  (Import-Clixml $f).GetNetworkCredential()
}

# ---------------------------------------------------------------- videos
# Pedazos de video pedidos por el sistema (alertas e incidentes): se sacan del
# DVR (loadfile.cgi, formato .dav), se pasan a MP4 liviano con ffmpeg, se suben
# con una URL firmada al bucket privado alarma-videos y se borran de la PC.
$Ffmpeg = "$env:LOCALAPPDATA\Microsoft\WinGet\Links\ffmpeg.exe"
if (-not (Test-Path $Ffmpeg)) { $Ffmpeg = (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source }

function HoraDvr($t) { ([DateTimeOffset]$t).ToOffset([TimeSpan]::FromHours(-4)).ToString('yyyy-MM-dd HH:mm:ss') -replace ' ', '%20' }

function SacarVideo($v) {
  $dav = Join-Path $env:TEMP "alarma_$($v.id).dav"; $mp4 = Join-Path $env:TEMP "alarma_$($v.id).mp4"
  try {
    if (-not $Ffmpeg) { throw 'ffmpeg no esta instalado en la PC' }
    $cr = CredDvr $v.ip
    $code = & curl.exe -s --digest -u "$($cr.UserName):$($cr.Password)" -m 600 -g -o $dav -w '%{http_code}' "http://$($v.ip)/cgi-bin/loadfile.cgi?action=startLoad&channel=$($v.canal)&startTime=$(HoraDvr $v.inicio)&endTime=$(HoraDvr $v.fin)&subtype=0"
    if ($code -ne '200' -or -not (Test-Path $dav) -or (Get-Item $dav).Length -lt 10KB) { throw "el DVR no entrego el video (HTTP $code)" }
    & $Ffmpeg -hide_banner -loglevel error -y -i $dav -vf 'scale=854:480,setsar=1' -c:v libx264 -preset veryfast -crf 26 -an -movflags +faststart $mp4
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $mp4)) { throw "ffmpeg fallo (codigo $LASTEXITCODE)" }
    $bytes = (Get-Item $mp4).Length
    $sub = Api @{ accion = 'video_subida'; video_id = $v.id }
    Invoke-WebRequest $sub.url -Method Put -InFile $mp4 -ContentType 'video/mp4' -UseBasicParsing -TimeoutSec 300 | Out-Null
    Api @{ accion = 'video_resultado'; video_id = $v.id; ok = $true; path = $sub.path; bytes = $bytes } | Out-Null
    Log "Video canal $($v.canal) listo ($([math]::Round($bytes / 1KB)) KB)"
  } catch {
    Log "Video $($v.id): $($_.Exception.Message)"
    try { Api @{ accion = 'video_resultado'; video_id = $v.id; ok = $false; error = $_.Exception.Message } | Out-Null } catch {}
  } finally {
    Remove-Item $dav, $mp4 -Force -ErrorAction SilentlyContinue
  }
}

function RevisarVideos {
  $r = Api @{ accion = 'videos_pendientes' }
  foreach ($v in $r.videos) { SacarVideo $v }
}

# ---------------------------------------------------------------- supervisor
if (-not $DvrId) {
  Log 'Supervisor iniciado'
  $hijos = @{}; $ultimaCfg = [datetime]::MinValue
  while ($true) {
    try {
      if (((Get-Date) - $ultimaCfg).TotalSeconds -ge 60) {
        $ultimaCfg = Get-Date
        $cfg = Api @{ accion = 'config' }
        foreach ($d in $cfg.dvrs) {
          $p = $hijos[$d.id]
          if (-not $p -or $p.HasExited) {
            if ($p) { Log "Escucha de $($d.nombre) se cerro (codigo $($p.ExitCode)); reiniciando" }
            $hijos[$d.id] = Start-Process powershell.exe -WindowStyle Hidden -PassThru -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$($MyInvocation.MyCommand.Path)`"",'-DvrId',$d.id)
            Log "Escucha iniciada para $($d.nombre) ($($d.ip))"
          }
        }
      }
      RevisarVideos
    } catch { Log "Supervisor: $($_.Exception.Message)" }
    Start-Sleep 20
  }
}

# ---------------------------------------------------------------- escucha de un DVR
$script:dvr = $null; $script:cfgAt = [datetime]::MinValue
$script:ultimo = @{}          # canal -> ultima vez que se envio
$script:usaPersonas = @{}     # canal -> $true si el DVR tiene deteccion de personas activa

$script:dvrOk = $false        # $true mientras hay conexion viva con el DVR
# Tambien es el "sigo vivo" de este escucha: si deja de llegar 5 min con la
# alarma armada, el servidor (pg_cron) manda un WhatsApp de "sin vigilancia".
function Refrescar {
  $cfg = Api @{ accion = 'config'; dvr_id = $DvrId; dvr_ok = $script:dvrOk; estado = $(if ($script:dvrOk) { 'escuchando el DVR' } else { 'sin conexion con el DVR' }) }
  $script:dvr = $cfg.dvrs | Where-Object { $_.id -eq $DvrId } | Select-Object -First 1
  $script:cfgAt = Get-Date
  if (-not $script:dvr) { Log 'DVR ya no esta activo en el sistema; saliendo'; exit 0 }
}
function RevisarPersonas {
  try {
    $cr = CredDvr $script:dvr.ip
    $t = & curl.exe -s --digest -u "$($cr.UserName):$($cr.Password)" -m 15 -g "http://$($script:dvr.ip)/cgi-bin/configManager.cgi?action=getConfig&name=SmartMotionDetect"
    $script:usaPersonas = @{}
    foreach ($l in $t) { if ($l -match 'SmartMotionDetect\[(\d+)\]\.Enable=true') { $script:usaPersonas[[int]$matches[1] + 1] = $true } }
  } catch { Log "RevisarPersonas: $($_.Exception.Message)" }
}
function Foto([int]$canal) {
  $cr = CredDvr $script:dvr.ip
  $tmp = [IO.Path]::GetTempFileName()
  & curl.exe -s --digest -u "$($cr.UserName):$($cr.Password)" -m 15 -o $tmp "http://$($script:dvr.ip)/cgi-bin/snapshot.cgi?channel=$canal"
  $b = [IO.File]::ReadAllBytes($tmp); Remove-Item $tmp -Force
  if ($b.Length -gt 1000) { [Convert]::ToBase64String($b) } else { $null }
}
function Evento([string]$code, [int]$canal) {
  $vig = $script:dvr.canales | Where-Object { [int]$_.canal -eq $canal -and $_.vigilar }
  if (-not $vig) { return }
  # si la camara tiene deteccion de personas, solo se avisa por personas
  if ($script:usaPersonas[$canal] -and $code -ne 'SmartMotionHuman') { return }
  if (-not $script:dvr.armada) { return }
  $u = $script:ultimo[$canal]; if ($u -and ((Get-Date) - $u).TotalSeconds -lt 60) { return }
  $script:ultimo[$canal] = Get-Date
  $foto = Foto $canal
  $r = Api @{ accion = 'evento'; dvr_id = $DvrId; canal = $canal; tipo = $(if ($code -eq 'SmartMotionHuman') { 'persona' } else { 'movimiento' }); ocurrido_at = (Get-Date).ToUniversalTime().ToString('o'); foto_b64 = $foto }
  Log "Evento $code canal $canal ($($vig.nombre)) -> aviso=$($r.aviso) omitido=$($r.omitido)"
}

Log "Escucha iniciada para DVR $DvrId"
Refrescar; RevisarPersonas
while ($true) {
  try {
    $cr = CredDvr $script:dvr.ip
    $req = [Net.HttpWebRequest]::Create("http://$($script:dvr.ip)/cgi-bin/eventManager.cgi?action=attach&codes=[VideoMotion,SmartMotionHuman]&heartbeat=5")
    $cc = New-Object Net.CredentialCache; $cc.Add([Uri]"http://$($script:dvr.ip)/", 'Digest', (New-Object Net.NetworkCredential($cr.UserName, $cr.Password)))
    $req.Credentials = $cc; $req.Timeout = 20000; $req.ReadWriteTimeout = 20000; $req.KeepAlive = $true
    $resp = $req.GetResponse(); $sr = New-Object IO.StreamReader($resp.GetResponseStream())
    Log "Conectado al DVR $($script:dvr.nombre)"
    $script:dvrOk = $true; Refrescar
    while ($true) {
      $l = $sr.ReadLine(); if ($null -eq $l) { throw 'El DVR cerro la conexion' }
      if (((Get-Date) - $script:cfgAt).TotalSeconds -ge 60) { Refrescar; if ((Get-Date).Minute -eq 0) { RevisarPersonas } }
      if ($l -match 'Code=(VideoMotion|SmartMotionHuman);action=Start;index=(\d+)') {
        try { Evento $matches[1] ([int]$matches[2] + 1) } catch { Log "Evento: $($_.Exception.Message)" }
      }
    }
  } catch {
    $script:dvrOk = $false
    Log "Conexion: $($_.Exception.Message) - reintento en 15 s"
    try { $sr.Dispose(); $resp.Close() } catch {}
    Start-Sleep 15
    try { Refrescar } catch {}
  }
}
