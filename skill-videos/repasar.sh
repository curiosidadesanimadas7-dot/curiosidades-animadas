#!/usr/bin/env bash
# Repaso rápido de un vídeo vertical antes de publicarlo.
# Hecho por Alex Rodríguez · IA para empresas · alexrg.com
#
#   bash repasar.sh VIDEO.mp4
#
# Necesita ffmpeg y ffprobe. No sube nada a ningún sitio.
set -euo pipefail
export LC_ALL=C   # que los decimales se lean con punto en cualquier idioma del sistema

V="${1:?Uso: bash repasar.sh VIDEO.mp4}"
[ -f "$V" ] || { echo "No existe: $V"; exit 1; }
BASE="${V%.*}"

W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$V")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$V")
R=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$V")
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")

[ "$W" = 1080 ] && [ "$H" = 1920 ] && echo "✓ mide 1080×1920" || echo "✗ no mide 1080×1920 (mide ${W}×${H})"
[ "$R" = "60/1" ] && echo "✓ va a 60 imágenes por segundo" || echo "✗ no va a 60 imágenes por segundo ($R): vuelve a generarlo con --fps 60"
if ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of csv=p=0 "$V" | grep -q audio; then
  echo "✓ tiene sonido"
else
  echo "✗ no tiene sonido: revisa que la voz esté en index.html como <audio>"
fi
awk -v d="$D" 'BEGIN{
  if (d >= 55 && d <= 70) printf "✓ dura %.1f s (entre 55 y 70)\n", d;
  else printf "✗ dura %.1f s: tiene que durar entre 55 y 70 s (ajusta el guion)\n", d;
  print "  Comprueba también que dura lo que la voz más un segundo."
}'

ffmpeg -v error -y -i "$V" -frames:v 1 "$BASE-primera.png"
echo "La primera imagen está en $BASE-primera.png: ¿se entiende sin sonido?"

# tira con seis momentos repartidos por el vídeo, para ponerla al lado de referencias/fotogramas/
P=$(awk -v d="$D" 'BEGIN{ printf "%.4f", 6 / d }')
ffmpeg -v error -y -i "$V" -vf "fps=${P},scale=270:480,tile=6x1" -frames:v 1 "$BASE-tira.jpg"
echo "La tira con seis momentos está en $BASE-tira.jpg: compárala con los fotogramas de referencia"
echo "(misma tinta, colores vivos, caras claras, nada desenfocado, ningún texto encima de una cara)."
echo
echo "Y ahora, míralo entero en el móvil, con sonido."
