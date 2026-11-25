#!/usr/bin/env bash
# Pone la voz del vídeo: hace assets/voz.wav y assets/transcript.json desde guion.txt.
#
#   cd mi-video && bash .../automatizacion/voz.sh
#
# Usa Gemini (gratis, con GEMINI_API_KEY). La voz local Kokoro queda solo de reserva para
# probar en el PC: en Modal no está instalada, así que sin Gemini el día falla y no se sube nada.
# Se lanza DESDE DENTRO de la carpeta del vídeo, como todo lo demás de la skill.
#
# Con Gemini sale gratis y además se ahorra una pasada de whisper: el motor de audio
# de la skill `media-use` transcribe al generar, así que de ahí salen los dos archivos.
set -euo pipefail
export LC_ALL=C

GUION="${1:-guion.txt}"

# La voz y la interpretación. Se pueden cambiar sin tocar el script:
#   VOZ=Rasalgethi ESTILO="..." bash voz.sh
VOZ="${VOZ:-Charon}"
MODELO_VOZ="${MODELO_VOZ:-gemini-3.8-flash-tts}"
ESTILO="${ESTILO:-Narrador de documental en español de España. Tono cercano y con un poco de sorna, como si contara algo importante sabiendo que es una tontería. Frases cortas, con una pausa breve entre ellas. Sin gritar y sin voz de anuncio.}"
VOZ_KOKORO="${VOZ_KOKORO:-ef_dora}"

aviso() { printf '\n==> %s\n' "$1"; }
morir() { printf '\nERROR: %s\n' "$1" >&2; exit 1; }

[ -f "$GUION" ] || morir "No existe $GUION. Escribe primero el guion (paso 1 de la skill)."
command -v node >/dev/null || morir "No encuentro node."
mkdir -p assets

# --- ¿Dónde está el motor de audio de la skill media-use? ---------------------
MOTOR="${MOTOR:-}"
if [ -n "$MOTOR" ]; then
  [ -f "$MOTOR" ] || morir "MOTOR apunta a algo que no existe: $MOTOR"
else
  for P in "$HOME/.claude/skills/media-use/audio/scripts/audio.mjs" \
           ".claude/skills/media-use/audio/scripts/audio.mjs" \
           "../.claude/skills/media-use/audio/scripts/audio.mjs"; do
    if [ -f "$P" ]; then MOTOR="$P"; break; fi
  done
fi

# --- Ruta 1: Gemini ----------------------------------------------------------
if [ -n "${GEMINI_API_KEY:-}${GOOGLE_API_KEY:-}" ] && [ -n "$MOTOR" ]; then
  aviso "Voz con Gemini ($MODELO_VOZ, voz $VOZ)"

  # La petición se escribe con node para que el guion se escape bien (tildes, comillas, saltos).
  GUION="$GUION" VOZ="$VOZ" MODELO_VOZ="$MODELO_VOZ" ESTILO="$ESTILO" node -e '
    const fs = require("fs");
    const texto = fs.readFileSync(process.env.GUION, "utf8").trim();
    if (!texto) { console.error("El guion está vacío."); process.exit(1); }
    fs.writeFileSync("audio_request.json", JSON.stringify({
      provider: "gemini",
      tts_model: process.env.MODELO_VOZ,
      voice: process.env.VOZ,
      lang: "es",
      style: process.env.ESTILO,
      lines: [{ id: "voz", text: texto }],
      bgm: { mode: "none" }
    }, null, 2));
  '

  # El motor transcribe la voz al generarla, y así se ahorra una pasada de whisper,
  # PERO solo si sabe dónde está el CLI de HyperFrames. Si no, devuelve 0 palabras
  # sin fallar, y te quedas sin subtítulos. Así que se lo decimos.
  if [ -z "${HYPERFRAMES_CLI_ENTRY:-}" ]; then
    for C in "$(npm root -g 2>/dev/null)/hyperframes/bin/hyperframes.mjs" \
             "node_modules/hyperframes/bin/hyperframes.mjs" \
             "../node_modules/hyperframes/bin/hyperframes.mjs"; do
      if [ -f "$C" ]; then export HYPERFRAMES_CLI_ENTRY="$C"; break; fi
    done
  fi
  if [ -z "${HYPERFRAMES_CLI_ENTRY:-}" ]; then
    # Instalado con npx: vive en una carpeta de caché con nombre aleatorio.
    # El `|| true` no sobra: si una de las carpetas no existe, find sale con error
    # y `set -e` mataría el script aquí mismo, sin imprimir nada.
    C=$(find "$HOME/AppData/Local/npm-cache/_npx" "$HOME/.npm/_npx" \
          -name hyperframes.mjs -path '*bin*' 2>/dev/null | head -1 || true)
    if [ -n "$C" ]; then export HYPERFRAMES_CLI_ENTRY="$C"; fi
  fi

  node "$MOTOR" --request audio_request.json --hyperframes . --out audio_meta.json --only tts \
    || morir "Gemini no ha podido generar la voz. Mira el error de arriba.
Si dice que falta la clave, pon GEMINI_API_KEY (gratis en aistudio.google.com)."

  # El motor deja el wav en assets/voice/voz.wav y, con suerte, las palabras.
  # Sale con 2 si hay voz pero no palabras, para transcribir aparte.
  set +e
  node -e '
    const fs = require("fs");
    const meta = JSON.parse(fs.readFileSync("audio_meta.json", "utf8"));
    const v = (meta.voices || [])[0];
    if (!v || !v.path) { console.error("audio_meta.json no trae la voz."); process.exit(1); }
    fs.copyFileSync(v.path, "assets/voz.wav");
    const palabras = v.words || [];
    if (!palabras.length) { console.error("  El motor no ha transcrito (0 palabras)."); process.exit(2); }
    fs.writeFileSync("assets/transcript.json", JSON.stringify(palabras, null, 2));
    console.log(`  ${palabras.length} palabras con su segundo, de ${v.path}`);
  '
  EXTRAIDO=$?
  set -e
  case "$EXTRAIDO" in
    0) ;;
    2) aviso "Transcribiendo aparte con whisper."
       npx --yes hyperframes transcribe assets/voz.wav --model small --language es \
         || morir "La transcripción ha fallado. Sin ella no hay subtítulos." ;;
    *) morir "No he podido sacar voz.wav de audio_meta.json." ;;
  esac

# --- Ruta 2: la voz local, de reserva ----------------------------------------
else
  if [ -z "$MOTOR" ]; then
    aviso "No encuentro el motor de audio de media-use (npx hyperframes skills). Voz local."
  else
    aviso "Sin GEMINI_API_KEY. Voz local Kokoro ($VOZ_KOKORO), que suena más robótica."
  fi
  npx --yes hyperframes tts "$GUION" --voice "$VOZ_KOKORO" --lang es -o assets/voz.wav \
    || morir "La voz local ha fallado. En Windows suele ser HYPERFRAMES_PYTHON sin poner."
  npx --yes hyperframes transcribe assets/voz.wav --model small --language es \
    || morir "La transcripción ha fallado."
fi

# --- Comprobar lo que ha salido ----------------------------------------------
[ -s assets/voz.wav ] || morir "No hay assets/voz.wav."
[ -s assets/transcript.json ] || morir "No hay assets/transcript.json."

D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 assets/voz.wav)
printf '\n==> Voz lista: assets/voz.wav — %.1f s\n' "$D"
awk -v d="$D" 'BEGIN{
  if (d >= 54 && d <= 69) printf "    Entra en los 54-69 s que pide la skill.\n";
  else printf "    AVISO: dura %.1f s y tiene que durar entre 54 y 69. Ajusta el guion y vuelve a lanzar esto.\n", d;
}'
