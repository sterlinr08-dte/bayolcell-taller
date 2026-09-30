# Instala el agente de alarma como tarea de Windows: arranca al iniciar sesion
# y se reinicia solo si se cae. Correr una vez con el usuario BAYOCELL.
$a = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Users\BAYOCELL\BayolCellAlarma\agente.ps1"'
$tr = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$s = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName 'BayolCell Alarma DVR' -Action $a -Trigger $tr -Settings $s -Description 'Escucha los DVR Dahua y avisa por WhatsApp (sistema taller)' -Force | Out-Null
Start-ScheduledTask 'BayolCell Alarma DVR'
Get-ScheduledTask 'BayolCell Alarma DVR' | Select-Object TaskName, State
