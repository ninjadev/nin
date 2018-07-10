param(
    [string]$demoPath = ".",
    $argz
)
$pathToNinRepo = Split-Path -Parent $PSCommandPath
if(!(Get-Command node -errorAction SilentlyContinue))
{
    throw "node not found, it needs to be installed to run nin. If it is installed, have you remembered to add it to your path?"
}
Push-Location $demoPath
node $pathToNinRepo\nin\backend\nin $argz
Pop-Location
