# Creates a double-clickable Desktop shortcut to Facebook Games Studio
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$batPath = Join-Path $projectRoot 'Launch Facebook Games Studio.bat'
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'Facebook Games Studio.lnk'

if (-not (Test-Path $batPath)) {
    throw "Launcher not found: $batPath"
}

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $batPath
$shortcut.WorkingDirectory = $projectRoot
$shortcut.WindowStyle = 7  # Minimized console flash
$shortcut.Description = 'Open Facebook Games Studio'
$shortcut.IconLocation = 'shell32.dll,13'
$shortcut.Save()

Write-Host "Desktop shortcut created:"
Write-Host "  $shortcutPath"
Write-Host ""
Write-Host "Double-click 'Facebook Games Studio' on your Desktop to open the app."
