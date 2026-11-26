#!/usr/bin/env bash
# La portada del vídeo, sacada del propio vídeo.
#
#   GANCHO="No duermes" CLAVE="3 DÍAS" SEGUNDO=12.4 bash .../automatizacion/portada.sh
#
# Coge un fotograma del vídeo, ENTERO y en vertical, y le pone el gancho encima con la
# tipografía de la plantilla: blanco con borde ciruela grueso y la palabra clave en
# amarillo, grandes, arriba (por encima de la cabeza). Deja portada.jpg de 1080×1920.
#
# Vertical desde el 26/11: en los Shorts, YouTube enseña la miniatura en vertical (pestaña
# Shorts del canal, estantes, búsqueda). La de 1280×720 se subía bien pero no se veía.
#
# Se lanza DESDE DENTRO de la carpeta del vídeo. Solo necesita ffmpeg.
set -euo pipefail
export LC_ALL=C

VIDEO="${1:-video.mp4}"
SALIDA="${SALIDA_PORTADA:-portada.jpg}"
GANCHO="${GANCHO:-}"
CLAVE="${CLAVE:-}"
SEGUNDO="${SEGUNDO:-}"

# La franja del vídeo vertical que se queda en la portada. La plantilla pone la
# parte de arriba de la cabeza al 28-35 % de los 1920 px, así que un recorte que
# empieza en 380 coge la cara y el torso. Súbelo o bájalo si corta mal.
RECORTE_Y="${RECORTE_Y:-380}"

# Los mismos colores que las palabras clave de index.html.
TINTA="0x241726"   # el borde ciruela
AMARILLO="0xffd23f"

morir() { printf '\nERROR: %s\n' "$1" >&2; exit 1; }

[ -f "$VIDEO" ] || morir "No existe $VIDEO."
command -v ffmpeg >/dev/null || morir "No encuentro ffmpeg."
[ -n "$GANCHO$CLAVE" ] || morir "Dime qué pone la portada: GANCHO=... y/o CLAVE=..."

# --- La fuente ---------------------------------------------------------------
# Por orden: las de la plantilla, y si no están, la más gorda que haya en el sistema.
FUENTE=""
for F in \
  "/c/Windows/Fonts/ArchivoBlack-Regular.ttf" \
  "/c/Windows/Fonts/Montserrat-Black.ttf" \
  "/c/Windows/Fonts/ariblk.ttf" \
  "/c/Windows/Fonts/impact.ttf" \
  "$HOME/.fonts/ArchivoBlack-Regular.ttf" \
  "/usr/share/fonts/truetype/archivo/ArchivoBlack-Regular.ttf" \
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" \
  "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"; do
  if [ -f "$F" ]; then FUENTE="$F"; break; fi
done
[ -n "$FUENTE" ] || morir "No encuentro ninguna fuente gorda para el texto.
En Linux: sudo apt-get install -y fonts-dejavu-core"

# ffmpeg quiere los dos puntos de la unidad escapados dentro del filtro:
# /c/Windows/... -> C\:/Windows/...
ffmpeg_ruta() {
  case "$1" in
    /[a-zA-Z]/*) printf '%s\\:%s' "$(echo "${1:1:1}" | tr '[:lower:]' '[:upper:]')" "${1:2}" ;;
    *) printf '%s' "$1" ;;
  esac
}
FUENTE_FF="$(ffmpeg_ruta "$FUENTE")"

# --- Qué fotograma ------------------------------------------------------------
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")
if [ -z "$SEGUNDO" ]; then
  # Sin indicar, un 15 % dentro: ya se ve la escena montada y aún no han salido
  # los subtítulos largos.
  SEGUNDO=$(awk -v d="$DUR" 'BEGIN{ printf "%.2f", d * 0.15 }')
fi
awk -v s="$SEGUNDO" -v d="$DUR" 'BEGIN{ exit !(s >= 0 && s < d) }' \
  || morir "SEGUNDO=$SEGUNDO está fuera del vídeo (dura $DUR s)."

# --- El texto ----------------------------------------------------------------
# Va en archivos y se lee con textfile=, así no hay que escapar tildes, comillas,
# dos puntos ni signos de porcentaje.
#
# Los archivos se quedan AQUÍ, al lado del vídeo, y se pasan con ruta relativa: el
# ffmpeg de Windows no sabe leer las rutas /tmp/... que inventa Git Bash.
G_FF=".portada-gancho.txt"
C_FF=".portada-clave.txt"
trap 'rm -f "$G_FF" "$C_FF"' EXIT
printf '%s' "$GANCHO" > "$G_FF"
printf '%s' "$CLAVE"  > "$C_FF"

# --- El formato ---------------------------------------------------------------
# RECORTE_Y ya no se usa (era para la portada horizontal); se acepta para no romper nada.
ANCHO=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$VIDEO")
ALTO=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$VIDEO")
[ "$ALTO" -gt "$ANCHO" ] || morir "El vídeo (${ANCHO}x${ALTO}) no es vertical."

# --- El tamaño de la letra ----------------------------------------------------
# drawtext no sabe encogerse solo, así que se estima: con una fuente negra, cada
# letra ocupa como 0,60 del cuerpo. Si no cabe en 1.180 px, se baja el cuerpo.
cuerpo() { # cuerpo <texto> <cuerpo_ideal> <ancho_por_letra>
  awk -v t="$1" -v ideal="$2" -v k="${3:-0.62}" 'BEGIN{
    n = length(t); if (n == 0) { print ideal; exit }
    cabe = 960 / (n * k);
    c = (cabe < ideal) ? cabe : ideal;
    if (c < 60) c = 60;
    printf "%d", c
  }'
}
C_GANCHO=$(cuerpo "$GANCHO" 120 0.64)
C_CLAVE=$(cuerpo "$CLAVE" 190 0.86)   # en mayúsculas y negrita, cada letra es más ancha

# --- Montarla ----------------------------------------------------------------
# La cabeza va al 28-35 % de la altura: el texto va ENCIMA, entre el 8 % y el 25 %.
FILTRO="scale=1080:1920"
if [ -n "$GANCHO" ] && [ -n "$CLAVE" ]; then
  FILTRO="$FILTRO,drawtext=fontfile='${FUENTE_FF}':textfile='${G_FF}':expansion=none:fontsize=${C_GANCHO}:fontcolor=white:borderw=14:bordercolor=${TINTA}:x=(w-text_w)/2:y=170"
  FILTRO="$FILTRO,drawtext=fontfile='${FUENTE_FF}':textfile='${C_FF}':expansion=none:fontsize=${C_CLAVE}:fontcolor=${AMARILLO}:borderw=18:bordercolor=${TINTA}:x=(w-text_w)/2:y=170+${C_GANCHO}*1.15"
else
  UNICO="$C_FF"; COLOR="$AMARILLO"; CUERPO="$C_CLAVE"
  if [ -z "$CLAVE" ]; then UNICO="$G_FF"; COLOR=white; CUERPO="$C_GANCHO"; fi
  FILTRO="$FILTRO,drawtext=fontfile='${FUENTE_FF}':textfile='${UNICO}':expansion=none:fontsize=${CUERPO}:fontcolor=${COLOR}:borderw=18:bordercolor=${TINTA}:x=(w-text_w)/2:y=220"
fi

ffmpeg -v error -y -ss "$SEGUNDO" -i "$VIDEO" -frames:v 1 -vf "$FILTRO" -q:v 2 "$SALIDA" \
  || morir "ffmpeg no ha podido montar la portada."

[ -s "$SALIDA" ] || morir "No ha salido $SALIDA."

# YouTube no acepta portadas de más de 2 MB.
BYTES=$(wc -c < "$SALIDA")
if [ "$BYTES" -gt 2000000 ]; then
  ffmpeg -v error -y -i "$SALIDA" -q:v 6 "$SALIDA.tmp.jpg" && mv "$SALIDA.tmp.jpg" "$SALIDA"
  BYTES=$(wc -c < "$SALIDA")
fi
[ "$BYTES" -le 2000000 ] || morir "La portada pesa $BYTES bytes y YouTube solo acepta 2 MB."

printf '\n==> Portada lista: %s — 1080x1920, %s KB, del segundo %s (fuente: %s)\n' \
  "$SALIDA" "$((BYTES / 1024))" "$SEGUNDO" "$(basename "$FUENTE")"
printf '    Mírala antes de subirla: que el texto no tape la cara y que se lea en pequeño.\n'
