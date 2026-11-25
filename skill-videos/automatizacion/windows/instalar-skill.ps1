# Copia la skill de este proyecto a donde Claude la busca de verdad.
#
#   powershell -ExecutionPolicy Bypass -File instalar-skill.ps1
#
# Hay DOS copias de la skill y es fácil olvidarse de una:
#   - la de este proyecto (donde se edita)
#   - la de ~/.claude/skills/skill-videos/ (la que Claude lee de verdad)
#
# Si editas la primera y no copias, el vídeo de las 6:00 usa la versión vieja y
# falla buscando archivos que "ya existen". Lanza esto después de cada cambio.

$ErrorActionPreference = "Stop"
$AQUI    = Split-Path -Parent $MyInvocation.MyCommand.Path
$ORIGEN  = Split-Path -Parent (Split-Path -Parent $AQUI)   # .../skill-videos
$DESTINO = Join-Path $HOME ".claude\skills\skill-videos"

if (-not (Test-Path (Join-Path $ORIGEN "SKILL.md"))) { throw "No encuentro la skill en $ORIGEN" }

"Origen:  $ORIGEN"
"Destino: $DESTINO"
""

# El estilo no debe cambiar nunca. Si cambia, es que alguien lo ha tocado y hay
# que mirarlo antes de pisar nada.
$motor = "plantilla\motor\estilo3d.js"
$mo = Join-Path $ORIGEN $motor
$md = Join-Path $DESTINO $motor
if ((Test-Path $md) -and (Test-Path $mo)) {
  $a = (Get-FileHash $mo -Algorithm MD5).Hash
  $b = (Get-FileHash $md -Algorithm MD5).Hash
  if ($a -ne $b) {
    Write-Warning "estilo3d.js es DISTINTO entre las dos copias."
    Write-Warning "El estilo no deberia cambiar nunca. Miralo antes de continuar."
    $r = Read-Host "Seguir de todas formas? (s/N)"
    if ($r -ne "s") { "Cancelado."; exit 1 }
  } else { "  estilo3d.js identico (el estilo no se toca)" }
}

if (Test-Path $DESTINO) {
  $antes = (Get-ChildItem $DESTINO -Recurse -File).Count
  Remove-Item $DESTINO -Recurse -Force
  "  reemplazando la copia anterior ($antes archivos)"
}

New-Item -ItemType Directory -Force -Path $DESTINO | Out-Null
Copy-Item -Path (Join-Path $ORIGEN "*") -Destination $DESTINO -Recurse -Force

$despues = (Get-ChildItem $DESTINO -Recurse -File).Count
""
"Listo: $despues archivos copiados."
foreach ($f in @("SKILL.md","automatizacion\voz.sh","automatizacion\portada.sh",
                 "automatizacion\dia.sh","plantilla\motor\estilo3d.js","repasar.sh")) {
  $p = Join-Path $DESTINO $f
  if (Test-Path $p) { "  ok     $f" } else { "  FALTA  $f" }
}
