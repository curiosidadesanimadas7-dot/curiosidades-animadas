#!/usr/bin/env bash
# Hace el vídeo del día de un canal sin que nadie mire.
# Lo llama dia.sh, que cada día a las 4:30 lanza GitHub Actions (.github/workflows/video-del-dia.yml).
#
#   bash skill-videos/automatizacion/generar.sh curiosidades-animadas
#
# Necesita: Node 22+, Chrome, FFmpeg, el comando `claude` y CLAUDE_CODE_OAUTH_TOKEN
# (el plan Pro, sacado con `claude setup-token`; va en los secretos del repo de GitHub).
# Lo único que hace este script es preparar la carpeta y el encargo: el vídeo
# lo monta Claude siguiendo la skill, paso por paso, como si se lo pidieras tú.
set -euo pipefail
export LC_ALL=C

CANAL="${1:-${CANAL:-curiosidades-animadas}}"
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL="$(cd "$AQUI/.." && pwd)"
BRIEF="$AQUI/canales/$CANAL.md"
HISTORIAL="$AQUI/canales/$CANAL-historial.md"

# Donde va el vídeo. Por defecto, una carpeta `salida/` donde lo hayas lanzado.
# El segundo argumento es la carpeta dentro de salida/CANAL/, y puede llevar barras:
#   bash generar.sh curiosidades-animadas 2026-11-24/1-publicar
SALIDA="${SALIDA:-$PWD/salida}"
FECHA="$(TZ=Europe/Madrid date +%Y-%m-%d)"
NOMBRE="${2:-$FECHA}"
PROYECTO="$SALIDA/$CANAL/$NOMBRE"
PADRE="$(dirname "$PROYECTO")"

# Sonnet y no Opus desde el 25/11: con Opus el vídeo agotó el límite del plan Pro
# a medias (24/11). Para probar otro: CLAUDE_MODEL=claude-opus-5 bash generar.sh ...
MODELO="${CLAUDE_MODEL:-claude-sonnet-5-5}"
VUELTAS="${MAX_TURNS:-300}"
MODO_PERMISOS="${MODO_PERMISOS:-acceptEdits}"
IDEA="${IDEA:-}"
# El tema que deja fijado Rubén para el próximo vídeo (dia.sh lo borra cuando sale bien).
IDEA_FIJA="$AQUI/canales/$CANAL-idea.md"
if [ -z "$IDEA" ] && [ -s "$IDEA_FIJA" ]; then IDEA="$(cat "$IDEA_FIJA")"; fi

aviso() { printf '\n==> %s\n' "$1"; }
morir() { printf '\nERROR: %s\n' "$1" >&2; exit 1; }

# --- Comprobaciones antes de gastar nada --------------------------------------
[ -f "$BRIEF" ] || morir "No existe el brief del canal: $BRIEF
Copia otro brief de automatizacion/canales/ y rellénalo."
if grep -q "RELLENA" "$BRIEF"; then
  morir "El brief $BRIEF todavía tiene cosas sin rellenar (busca RELLENA)."
fi
# En la nube no hay sesión iniciada: Claude entra con el token del plan Pro.
if [ -n "${MODAL_TASK_ID:-}${GITHUB_ACTIONS:-}" ] && [ -z "${CLAUDE_CODE_OAUTH_TOKEN:-}${ANTHROPIC_API_KEY:-}" ]; then
  morir "Falta CLAUDE_CODE_OAUTH_TOKEN en los secretos (sale de: claude setup-token)."
fi

# --- ¿Dónde está Claude Code? -------------------------------------------------
# No se da por hecho que esté en el PATH: la app de escritorio lo instala en
# .local/bin y NO lo añade (en Modal va instalado con npm y sí está en el PATH).
CLAUDE="${CLAUDE_BIN:-}"
if [ -z "$CLAUDE" ]; then
  if command -v claude >/dev/null 2>&1; then
    CLAUDE="claude"
  else
    for C in "$HOME/.local/bin/claude.exe" "$HOME/.local/bin/claude" \
             "$HOME/.claude/local/claude" "$HOME/.claude/local/claude.exe"; do
      if [ -x "$C" ]; then CLAUDE="$C"; break; fi
    done
  fi
fi
[ -n "$CLAUDE" ] || morir "No encuentro el comando 'claude'.
Búscalo con:  where.exe claude
y pásalo con: CLAUDE_BIN=C:/ruta/a/claude.exe"

command -v ffprobe >/dev/null || morir "No encuentro ffprobe (instala FFmpeg)."

if [ -d "$PROYECTO" ]; then
  aviso "Ya había una carpeta de hoy. La aparto como $NOMBRE-$(date +%H%M)."
  mv "$PROYECTO" "$PROYECTO-$(date +%H%M)"
fi

# --- 1. La carpeta del vídeo, ya en vertical y con la plantilla encima --------
aviso "Creando el proyecto en $PROYECTO"
mkdir -p "$PADRE"
(cd "$PADRE" && npx --yes hyperframes init "$(basename "$PROYECTO")" --resolution portrait --non-interactive)
cp -r "$SKILL/plantilla/." "$PROYECTO/"
[ -f "$PROYECTO/escena.js" ] || morir "La plantilla no se ha copiado bien en $PROYECTO."

# --- 2. El encargo -----------------------------------------------------------
# Se junta el guion de trabajo (prompt.md) con el brief del canal y con los temas
# que ya se han contado, para que no repita.
ENCARGO="$PROYECTO/encargo.md"
{
  sed -e "s|{{CANAL}}|$CANAL|g" \
      -e "s|{{FECHA}}|$FECHA|g" \
      -e "s|{{HISTORIAL}}|$HISTORIAL|g" \
      "$AQUI/prompt.md"
  echo
  echo "---"
  echo
  echo "## El brief del canal \`$CANAL\`"
  echo
  cat "$BRIEF"
  echo
  echo "---"
  echo
  echo "## Lo que ya has contado en este canal (no lo repitas)"
  echo
  if [ -s "$HISTORIAL" ]; then cat "$HISTORIAL"; else echo "Todavía nada: este es el primero."; fi
  if [ -n "$IDEA" ]; then
    echo
    echo "---"
    echo
    echo "## La idea de hoy (manda sobre la elección de tema del brief)"
    echo
    echo "$IDEA"
  fi
} > "$ENCARGO"

# --- 3. Que Claude lo monte --------------------------------------------------
aviso "Claude se pone a montar el vídeo (modelo $MODELO). Esto es lo largo."
cd "$PROYECTO"
# Sin nadie delante, cualquier comando que pida aprobación se queda bloqueado
# (pasó el 24/11: no salió ni la voz). Así que se le deja usar SOLO lo que pide
# la skill; lo demás (curl, borrar fuera, etc.) sigue bloqueado. Probado.
#   --add-dir: la skill instalada (SKILL.md, voz.sh, portada.sh, referencias/)
#              y canales/ de esta copia (el historial que tiene que apuntar).
#   Las reglas con "=" son para portada.sh, que se lanza con GANCHO=... delante.
PERMISOS=(
  "Bash(bash:*)"
  "Bash(npx hyperframes:*)" "Bash(npx --yes hyperframes:*)"
  "Bash(npm run:*)"
  "Bash(node:*)"
  "Bash(ffprobe:*)" "Bash(ffmpeg:*)"
  "Bash(GANCHO=*)" "Bash(CLAVE=*)" "Bash(SEGUNDO=*)" "Bash(RECORTE_Y=*)"
  # Para buscar la noticia del día y comprobar cada dato (desde el 26/11).
  "WebSearch" "WebFetch"
)
SKILL_INSTALADA="$HOME/.claude/skills/skill-videos"
# En Modal canales/ es un enlace al volumen (/__modal/volumes/...): Claude solo deja
# escribir en la ruta REAL, así que se le da también esa (25/11 no pudo apuntar el historial).
CANALES_REAL="$(cd "$AQUI/canales" && pwd -P)"
set +e
"$CLAUDE" -p "$(cat "$ENCARGO")" \
  --model "$MODELO" \
  --max-turns "$VUELTAS" \
  --permission-mode "$MODO_PERMISOS" \
  --add-dir "$SKILL_INSTALADA" "$AQUI/canales" "$CANALES_REAL" \
  --allowedTools "${PERMISOS[@]}" \
  --verbose 2>&1 | tee claude.log
SALIO=${PIPESTATUS[0]}
set -e
[ "$SALIO" -eq 0 ] || morir "Claude ha terminado mal (código $SALIO). Mira $PROYECTO/claude.log."

# --- 4. ¿Ha salido un vídeo que valga? ---------------------------------------
[ -f "$PROYECTO/video.mp4" ] || morir "No hay video.mp4 en $PROYECTO. Mira claude.log."

D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$PROYECTO/video.mp4")
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$PROYECTO/video.mp4")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$PROYECTO/video.mp4")
aviso "Vídeo listo: $PROYECTO/video.mp4 — ${W}×${H}, $(printf '%.1f' "$D") s"
[ "$W" = 1080 ] && [ "$H" = 1920 ] || morir "No mide 1080×1920 (mide ${W}×${H})."
awk -v d="$D" 'BEGIN{ exit !(d >= 54 && d <= 71) }' || morir "Dura $(printf '%.1f' "$D") s y tiene que durar entre 55 y 70."

aviso "Hecho. El vídeo está en $PROYECTO/video.mp4"
