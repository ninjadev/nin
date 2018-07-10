$pathToNinRepo = Split-Path -Parent $PSCommandPath
Push-Location $pathToNinRepo
if(!(Get-Command yarn -errorAction SilentlyContinue))
{
    Pop-Location
    throw "yarn not found, it needs to be installed to make nin. If it is installed, have you remembered to add it to your path?"
}
if(!(Get-Command npm -errorAction SilentlyContinue))
{
    Pop-Location
    throw "npm not found, it needs to be installed to make nin. If it is installed, have you remembered to add it to your path?"
}
yarn start
Pop-Location
