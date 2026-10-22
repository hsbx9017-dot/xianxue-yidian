$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$env:NODE_USE_ENV_PROXY = '1'
$taskNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (-not (Test-Path -LiteralPath $taskNode)) { $taskNode = (Get-Command node -ErrorAction Stop).Source }
if (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 4318 -InformationLevel Quiet -WarningAction SilentlyContinue)) {
 Start-Process -FilePath $taskNode -ArgumentList ('"' + (Join-Path $taskRoot 'scripts\feedback-admin.mjs') + '"') -WorkingDirectory $taskRoot -WindowStyle Hidden
 for ($taskTry=0; $taskTry -lt 30; $taskTry++) {
  try { $taskStatus = Invoke-RestMethod 'http://127.0.0.1:4318/__admin/status'; if ($taskStatus.localAdmin) { break } } catch {}
  Start-Sleep -Milliseconds 200
 }
}
$taskStatus = Invoke-RestMethod 'http://127.0.0.1:4318/__admin/status'
if (-not $taskStatus.localAdmin) { throw '4318端口不是本地反馈管理服务。' }
Start-Process 'http://127.0.0.1:4318/__admin'
