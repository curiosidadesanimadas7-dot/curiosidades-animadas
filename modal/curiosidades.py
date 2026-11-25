"""
El vídeo del día de Curiosidades Animadas, en la nube de Modal.

Cada día a las 4:30 (hora de Madrid) Modal enciende un ordenador, hace UN short
con la skill `videos-historia-ilustrada`, lo sube a YouTube ya programado y se
apaga. El PC de Rubén no tiene que estar encendido.

    modal run    modal/curiosidades.py            # una vez, ahora, para probar
    modal deploy modal/curiosidades.py            # deja puesto el reloj de las 4:30

Se lanza desde la carpeta skill-videos-github/ (la de ESTADO.md).

Lo que vive FUERA de este archivo:
  - Secreto `curiosidades` en Modal: CLAUDE_CODE_OAUTH_TOKEN, GEMINI_API_KEY,
    YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN.
  - Volumen `curiosidades-datos`: lo que tiene que sobrevivir de un día a otro.
      /datos/canales/   historial de temas y vídeos programados (la memoria del canal)
      /datos/salida/    los vídeos hechos, con su guion, plan y claude.log
      /datos/logs/      el registro de cada día (Modal solo guarda 1 día de logs gratis)
"""

from pathlib import Path
import os
import shutil
import subprocess
import datetime
import zoneinfo

import modal

AQUI = Path(__file__).resolve().parent
PROYECTO = AQUI.parent                       # skill-videos-github/
SKILL_LOCAL = PROYECTO / "skill-videos"
SKILLS_PC = Path.home() / ".claude" / "skills"   # hyperframes y media-use, tal como van en el PC

HOME = "/root"
SKILLS = f"{HOME}/.claude/skills"
SKILL = f"{SKILLS}/skill-videos"
DATOS = "/datos"
CANAL = "curiosidades-animadas"

# Lo que pide Chrome para arrancar sin pantalla, más FFmpeg y fuentes.
PAQUETES = [
    "ffmpeg", "unzip", "curl", "ca-certificates", "gnupg", "git", "tzdata",
    "cmake", "build-essential",   # hyperframes compila whisper.cpp (los subtítulos) con esto
    "fonts-liberation", "fonts-dejavu-core",
    "libnss3", "libatk1.0-0", "libatk-bridge2.0-0", "libcups2", "libdrm2",
    "libxkbcommon0", "libxcomposite1", "libxdamage1", "libxfixes3", "libxrandr2",
    "libgbm1", "libasound2", "libpango-1.0-0", "libcairo2", "libxshmfence1",
]

imagen = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install(*PAQUETES)
    .run_commands(
        # Node 22, como en el PC
        "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -",
        "apt-get install -y nodejs",
        "npm install -g hyperframes @anthropic-ai/claude-code",
        "hyperframes --version && claude --version",
        # Chrome para el render, ya descargado dentro de la imagen
        "hyperframes browser ensure",
        # La tipografía de la portada (si no está, portada.sh tira de DejaVu)
        "mkdir -p /root/.fonts && curl -fsSL -o /root/.fonts/ArchivoBlack-Regular.ttf "
        "https://github.com/google/fonts/raw/main/ofl/archivoblack/ArchivoBlack-Regular.ttf "
        "&& fc-cache -f || true",
    )
    # Las skills que Claude necesita: las mismas que en el PC.
    .add_local_dir(SKILLS_PC / "hyperframes", f"{SKILLS}/hyperframes", copy=True)
    .add_local_dir(SKILLS_PC / "media-use", f"{SKILLS}/media-use", copy=True)
    .run_commands(
        # Que whisper (los subtítulos) baje su modelo AHORA y no a las 4:30.
        "cd /tmp && ffmpeg -v error -f lavfi -i sine=d=2 -ar 16000 prueba.wav "
        "&& hyperframes transcribe prueba.wav --model small --language es",
        "hyperframes doctor || true",
    )
    # La nuestra va la última: es la que más cambia, y así no se rehace todo lo de arriba.
    .add_local_dir(SKILL_LOCAL, SKILL, copy=True,
                   ignore=["**/canales/*-historial.md",
                           "**/canales/*-programados.json",
                           "**/canales/autorizado.json",
                           "**/windows/**"])
)

app = modal.App("curiosidades-animadas", image=imagen)
datos = modal.Volume.from_name("curiosidades-datos", create_if_missing=True)
secreto = modal.Secret.from_name("curiosidades")


def preparar_canales():
    """Los briefs vienen con la imagen; el historial y lo programado, del volumen."""
    vol = Path(DATOS) / "canales"
    vol.mkdir(parents=True, exist_ok=True)
    de_imagen = Path(SKILL) / "automatizacion" / "canales"
    for f in de_imagen.glob("*.md"):
        if not f.name.endswith("-historial.md"):
            shutil.copy2(f, vol / f.name)         # el brief manda el de la imagen
    if de_imagen.is_symlink() or de_imagen.exists():
        if de_imagen.is_symlink():
            de_imagen.unlink()
        else:
            shutil.rmtree(de_imagen)
    de_imagen.symlink_to(vol)                     # generar.sh y subir.mjs escriben aquí


@app.function(
    schedule=modal.Cron("30 4 * * *", timezone="Europe/Madrid"),
    secrets=[secreto],
    volumes={DATOS: datos},
    cpu=8.0,
    memory=16384,
    timeout=4 * 60 * 60,      # 4 h de techo; si se pasa, algo va mal
    retries=0,                # si falla, NO se repite: cada intento gasta límite de Claude
)
def video_del_dia(idea: str = ""):
    preparar_canales()
    hoy = datetime.datetime.now(zoneinfo.ZoneInfo("Europe/Madrid"))
    logs = Path(DATOS) / "logs"
    logs.mkdir(exist_ok=True)
    log = logs / f"dia-{hoy:%Y-%m-%d-%H%M}.txt"

    env = dict(os.environ, HOME=HOME, CANAL=CANAL, SALIDA=f"{DATOS}/salida",
               HYPERFRAMES_SKIP_SKILLS="1", TZ="Europe/Madrid")
    if idea:
        env["IDEA"] = idea

    print(f"Empieza el día {hoy:%Y-%m-%d %H:%M} (Madrid). Registro: {log}", flush=True)
    with open(log, "w", encoding="utf-8") as f:
        p = subprocess.Popen(["bash", f"{SKILL}/automatizacion/dia.sh", CANAL],
                             cwd=DATOS, env=env, stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT, text=True, bufsize=1)
        for linea in p.stdout:
            print(linea, end="", flush=True)
            f.write(linea)
            f.flush()
        codigo = p.wait()
    datos.commit()
    print(f"\ndia.sh ha terminado con código {codigo}", flush=True)
    if codigo != 0:
        raise RuntimeError(f"El día ha fallado (código {codigo}). Mira {log} en el volumen.")


@app.function(volumes={DATOS: datos})
def sembrar(historial: str, programados: str):
    """Una sola vez: sube al volumen el historial y lo programado que hay en el PC."""
    vol = Path(DATOS) / "canales"
    vol.mkdir(parents=True, exist_ok=True)
    (vol / f"{CANAL}-historial.md").write_text(historial, encoding="utf-8")
    (vol / f"{CANAL}-programados.json").write_text(programados, encoding="utf-8")
    datos.commit()
    print("Historial y programados guardados en el volumen.")


@app.local_entrypoint()
def main(idea: str = "", sembrar_datos: bool = False):
    if sembrar_datos:
        c = SKILL_LOCAL / "automatizacion" / "canales"
        sembrar.remote((c / f"{CANAL}-historial.md").read_text(encoding="utf-8"),
                       (c / f"{CANAL}-programados.json").read_text(encoding="utf-8"))
        return
    video_del_dia.remote(idea)
