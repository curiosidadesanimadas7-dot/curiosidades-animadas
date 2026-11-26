#!/usr/bin/env bash
# El vídeo del día de un canal: lo hace y lo sube, ya programado.
#
#   bash skill-videos/automatizacion/dia.sh curiosidades-animadas
#
#   salida/CANAL/FECHA/1-publicar/video.mp4   ← el que se sube al canal
#
# Desde el 25/11 es UN vídeo al día (antes eran dos: uno a publicar y otro a
# revisar). Si algún día se quieren más, se añaden huecos a HUECOS: van uno
# detrás de otro, y solo se sube el primero.
#
# Solo se sube si generar.sh ha terminado BIEN. El 24/11 se subió un vídeo cuyo
# Claude se había cortado a medias (el render siguió solo y dejó video.mp4).
set -uo pipefail
export LC_ALL=C

CANAL="${1:-${CANAL:-curiosidades-animadas}}"
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FECHA="$(TZ=Europe/Madrid date +%Y-%m-%d)"
SALIDA="${SALIDA:-$PWD/salida}"

# Los huecos del día. El orden manda: el primero es el que se publica.
HUECOS=("1-publicar")

titulo() { printf '\n\n########## %s ##########\n\n' "$1"; }

declare -a RESULTADO=()
PRIMERO_OK=0
for i in "${!HUECOS[@]}"; do
  H="${HUECOS[$i]}"
  titulo "Vídeo $((i + 1)) de ${#HUECOS[@]}: $H"
  # Claude no necesita las claves de YouTube: se las quitamos para que no las vea nunca.
  if env -u YT_CLIENT_ID -u YT_CLIENT_SECRET -u YT_REFRESH_TOKEN        SALIDA="$SALIDA" bash "$AQUI/generar.sh" "$CANAL" "$FECHA/$H"; then
    RESULTADO+=("$H: hecho")
    if [ "$i" -eq 0 ]; then PRIMERO_OK=1; fi
  else
    RESULTADO+=("$H: HA FALLADO")
  fi
done

titulo "Resumen del día $FECHA"
FALLOS=0
for R in "${RESULTADO[@]}"; do
  printf '  %s\n' "$R"
  case "$R" in *HA\ FALLADO) FALLOS=$((FALLOS + 1));; esac
done

CARPETA_PUBLICAR="$SALIDA/$CANAL/$FECHA/${HUECOS[0]}"
PUBLICAR="$CARPETA_PUBLICAR/video.mp4"
printf '\n'
if [ "$PRIMERO_OK" -eq 1 ] && [ -f "$PUBLICAR" ]; then
  printf '  El de subir:     %s\n' "$PUBLICAR"
elif [ -f "$PUBLICAR" ]; then
  printf '  OJO: hay video.mp4 pero su generación FALLÓ. No lo subo: míralo antes.\n  %s\n' "$PUBLICAR"
else
  printf '  OJO: no hay vídeo para subir (%s no existe).\n' "$PUBLICAR"
fi

# --- Subirlo y dejarlo programado -------------------------------------------
# Solo el primero, y solo si salió bien.
# Para hacer el vídeo sin subir nada: SIN_SUBIR=1 bash dia.sh ...
if [ "$PRIMERO_OK" -eq 1 ] && [ -f "$PUBLICAR" ] && [ -z "${SIN_SUBIR:-}" ]; then
  if [ -n "${YT_REFRESH_TOKEN:-}" ]; then
    titulo "Subiendo el de publicar"
    if node "$AQUI/subir.mjs" --dir "$CARPETA_PUBLICAR" --canal "$CANAL"; then
      :
    else
      printf '\n  La subida ha fallado. El vídeo está hecho y a salvo en:\n  %s\n' "$CARPETA_PUBLICAR"
      printf '  Puedes reintentarla luego:  node %s --dir %s --canal %s\n' "$AQUI/subir.mjs" "$CARPETA_PUBLICAR" "$CANAL"
      FALLOS=$((FALLOS + 1))
    fi
  else
    printf '\n  Sin YT_REFRESH_TOKEN: no subo nada. El vídeo se queda en su carpeta.\n'
    printf '  Para autorizar la subida, una sola vez: node %s\n' "$AQUI/autorizar.mjs"
  fi
fi

[ "$FALLOS" -eq 0 ] || exit 1
