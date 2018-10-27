param(
    [switch]$compile,
    [string]$demoPath = ".",
    $argz
)
if($compile){
    $pathToNinRepo = Split-Path -Parent $PSCommandPath
    Push-Location $pathToNinRepo
    if(!(Get-Command npm -errorAction SilentlyContinue))
    {
        Pop-Location
        throw "npm not found, it needs to be installed to make nin. If it is installed, have you remembered to add it to your path?"
    }
    npm start
    Pop-Location
}
else{
    $pathToNinRepo = Split-Path -Parent $PSCommandPath
    if(!(Get-Command node -errorAction SilentlyContinue))
    {
        throw "node not found, it needs to be installed to run nin. If it is installed, have you remembered to add it to your path?"
    }
    Push-Location $demoPath
    node $pathToNinRepo\nin\backend\nin $argz
    Pop-Location
}
