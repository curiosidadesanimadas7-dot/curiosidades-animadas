# Dónde va esto y cómo seguir

> **Si eres Claude y acabas de llegar: lee este archivo entero antes de tocar nada.**
> Última actualización: 25 de noviembre de 2026 (noche).
>
> **Resumen:** el canal Curiosidades Animadas **ya funciona solo en Modal** (modal.com). El PC de
> Rubén ya no hace nada: no hay tarea de Windows ni hibernación. Para el segundo canal, lee
> `NUEVO-CANAL.md`.

---

## 1. Qué hace

Cada día a las **4:30 de Madrid**, Modal enciende un ordenador en la nube y:

1. Hace **un short** vertical de 55-70 s con la skill `videos-historia-ilustrada` (Claude monta el
   vídeo; Gemini pone la voz).
2. Lo **sube a YouTube en privado y programado** a la hora de `horario.json`, con título,
   descripción, hashtags y portada. **Solo si la generación terminó bien.**
3. Se apaga. Modal solo cobra mientras está encendido.

El vídeo no sale a las 4:30: sale solo a su hora (por ejemplo, el miércoles a las 17:30).

---

## 2. Decisiones ya tomadas (no las vuelvas a abrir)

| Decisión | Qué se eligió | Por qué |
|---|---|---|
| **Dónde corre** | **Modal**, con `modal.Cron("30 4 * * *", timezone="Europe/Madrid")` | El PC no se despertaba a las 6:00 (la hora de entonces). En Modal no hace falta el PC y entra en los 30 $/mes gratis |
| **Cuántos vídeos** | **Un short al día, y se sube** | Antes eran dos (uno a publicar y otro a revisar) |
| **Modelo de Claude** | `claude-sonnet-5-5` (en `generar.sh`) | Con Opus se acabó el límite del plan Pro a mitad de vídeo |
| **Cómo entra Claude** | Plan Pro de Rubén, con `CLAUDE_CODE_OAUTH_TOKEN` (sale de `claude setup-token`) | No gasta créditos de API. **El límite del Pro es uno para toda la cuenta** |
| **La voz** | Gemini `gemini-3.8-flash-tts`, voz **Charon** | Kokoro sonaba robótica y ElevenLabs costaba 22 $/mes |
| **Largo del guion** | **160-190 palabras** | Medido: Charon va a 2,75-3,1 palabras/s |
| **Estilo de los guiones** | Curiosidades de todo tipo con gancho en el primer segundo (cambio del 25/11) | Ver el brief `canales/curiosidades-animadas.md`, con los 4 shorts de ejemplo |
| **Comas** | Pocas en el guion; **ninguna en pantalla** | `subtitulos.mjs` las quita al escribir los subtítulos |
| **Subir a YouTube** | `privacyStatus: private` + `publishAt` | Es como funciona «Programar» |
| **App de Google** | **Publicada** | En modo prueba el permiso caduca a los 7 días |
| **El estilo del vídeo** | **No se toca** | Solo se cambian `escena.js` y las zonas marcadas de `index.html` |

---

## 3. El mapa de archivos

```
skill-videos-github/
├── ESTADO.md                 ← este archivo
├── NUEVO-CANAL.md            encargo para montar el segundo canal
├── modal/
│   └── curiosidades.py       LA APP DE MODAL: imagen, reloj de las 4:30, volumen, secreto
├── paginas/                  las dos páginas web de la app de Google (ya publicadas)
└── skill-videos/             la skill (en Modal va copiada a /root/.claude/skills/skill-videos)
    ├── SKILL.md              los 6 pasos. NO tocar el estilo
    ├── repasar.sh            mide el vídeo acabado
    ├── plantilla/            index.html, escena.js, subtitulos.mjs, motor/estilo3d.js
    ├── referencias/          fotogramas de otro creador: solo para mirar, NO se publican
    └── automatizacion/
        ├── dia.sh            el día: genera el vídeo y, si salió bien, lo sube
        ├── generar.sh        UN vídeo: carpeta + encargo + claude -p (con permisos limitados)
        ├── prompt.md         el encargo que recibe Claude
        ├── voz.sh            voz.wav + transcript.json (Gemini)
        ├── portada.sh        portada.jpg 1280×720 sacada del vídeo
        ├── cuando.mjs        a qué hora sale el vídeo (con cambios de hora)
        ├── horario.json      la tabla de días y horas
        ├── subir.mjs         sube a YouTube, programado
        ├── autorizar.mjs     saca el permiso de YouTube (una vez por canal)
        ├── windows/instalar-skill.ps1   solo para probar la skill en el PC, no hace falta
        └── canales/
            ├── curiosidades-animadas.md            el brief del canal
            ├── curiosidades-animadas-historial.md  copia; la buena está en el volumen
            └── curiosidades-animadas-programados.json  copia; la buena está en el volumen
```

**Cómo encaja:**

```
Modal, 4:30 Madrid → video_del_dia()  (modal/curiosidades.py)
 └── dia.sh
      ├── generar.sh "1-publicar" → claude -p (Sonnet) → los 6 pasos de la skill
      │     ├── voz.sh      → assets/voz.wav + assets/transcript.json
      │     ├── subtitulos.mjs, check, render → video.mp4
      │     ├── portada.sh  → portada.jpg
      │     └── resumen.json + una línea en el historial
      └── (solo si generar.sh salió bien) subir.mjs → cuando.mjs → YouTube, programado
```

---

## 4. Lo que hay en Modal

- **Cuenta:** `curiosidadesanimadas7`. CLI en el PC: `python -m modal` (versión 1.6.4).
- **App `curiosidades-animadas`** (desplegada; el reloj de las 4:30 está activo). Imagen Debian con
  Node 22, hyperframes, Claude Code, Chrome, FFmpeg, whisper y las skills `hyperframes`,
  `media-use` y `skill-videos`. 8 núcleos, 16 GB, 4 h como máximo, **sin reintentos** (cada
  intento gasta límite de Claude).
- **Volumen `curiosidades-datos`:**
  - `canales/`: historial y programados, la memoria del canal. Es **la copia buena**.
  - `salida/`: los vídeos, con su guion, plan y `claude.log`.
  - `logs/`: el registro de cada día (`dia-AAAA-MM-DD-HHMM.txt`).
- **Secreto `curiosidades`**, con 5 claves: `CLAUDE_CODE_OAUTH_TOKEN`, `GEMINI_API_KEY`,
  `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN`. **Lo crea Rubén**; nunca se pegan claves
  en el chat.

### Comandos (desde la carpeta `skill-videos-github/`)

```powershell
python -m modal deploy modal/curiosidades.py      # después de CUALQUIER cambio en la skill o la app
python -m modal run --detach modal/curiosidades.py   # un vídeo ahora, a mano (se sube de verdad)
python -m modal volume get curiosidades-datos logs/dia-2026-11-26-0430.txt .   # ver un día
python -m modal volume ls curiosidades-datos salida/curiosidades-animadas
```

> **Importante:** si cambias algo de `skill-videos/` y no haces `modal deploy`, Modal sigue con la
> versión vieja.

---

## 5. Probado de verdad

- **25/11, prueba completa en Modal:** de 18:43 a 20:10 (~87 min). Salió «Tus dedos no se arrugan
  por el agua: lo hace tu cerebro», 60,6 s, 1080×1920 a 60 fps. `check` y `repasar.sh` sin errores,
  subtítulos sin comas y portada bien. Subido y programado: https://youtu.be/pBlZFNCCskY.
- **Coste:** ~0,75 $ por vídeo, **~22 $/mes** de los 30 $ gratis de Modal (estimado; vigilarlo).
- Lo de siempre: la hora de salida con los cambios de hora, el permiso de YouTube (solo
  `youtube.upload`) y que los hashtags se validen.

**Sin probar todavía:** el arreglo del historial (ver el apartado 6, fallo 10). Se verá el 26/11.

---

## 6. Fallos ya encontrados y arreglados (no los repitas)

1. **El Claude que trabaja solo no podía lanzar comandos** («requires approval»). `generar.sh` le
   da una lista cerrada (`--allowedTools`: bash, npx hyperframes, node, ffmpeg…) y `--add-dir`.
2. **Se acabó el límite del Pro con Opus** y `dia.sh` subió un vídeo sin terminar (`k3g3Q1TutkY`).
   Ahora solo se sube si `generar.sh` termina bien, y se usa Sonnet.
3. **El token de Claude se cortaba al copiarlo** de la terminal (se partía en dos líneas). Tiene
   108 caracteres.
4. **whisper no compilaba en Modal:** faltaban `cmake` y `build-essential`. Ahora el calentamiento
   de whisper es obligatorio al construir la imagen: si falla, se para.
5. **Los subtítulos salían vacíos sin dar error.** `voz.sh` localiza el CLI y, si no hay palabras,
   transcribe aparte.
6. **La portada salía achatada:** el recorte se calcula sobre el ancho (`iw*9/16`).
7. **`set -e` matando scripts en silencio.** Usar `|| true` o `if`.
8. **El token de YouTube guardado con el prefijo pegado** (`YT_REFRESH_TOKEN=1//...`) daba
   `invalid_grant`. Tiene que empezar por `1//`.
9. **El día terminaba con código 0 aunque fallara.** Ahora propaga el error, y Modal lo marca como
   fallido.
10. **Claude no podía escribir el historial en Modal**, porque `canales/` es un enlace al volumen
    y `--add-dir` solo daba la ruta del enlace. Arreglado con `CANALES_REAL` (`pwd -P`). La línea
    del 25/11 se añadió a mano.

---

## 7. Lo que no se toca

- **`motor/estilo3d.js` y la plantilla.** Solo `escena.js` y las zonas marcadas de `index.html`.
- **Los avisos normales de `npx hyperframes check`:** `outside_safe_zone` y `line_unread` en `.sub`,
  `contrast_aa_failure` en `.clave`, `canvas_content_at_edge`, `timeline_track_too_dense` y
  `KHR_parallel_shader_compile`. No son errores.
- **Los fotogramas de `referencias/`.** Son de otro creador: solo para mirar el estilo.
- **Rubén prefiere que le pregunten** antes de improvisar un arreglo, sobre todo si implica
  instalar algo grande o gastar dinero.

---

## 8. Datos del canal

- **Canal:** Curiosidades Animadas. Curiosidades de todo tipo para gente de 14 a 25 años.
- **GitHub:** `curiosidadesanimadas7-dot` (solo para las dos páginas de la app de Google).
- **App de Google:** «Subida Curiosidades», publicada, con las páginas en
  `https://curiosidadesanimadas7-dot.github.io/`.
- **Horario** (`horario.json`, hora de Madrid). Se usa la mejor; la segunda solo si la mejor ya
  pasó:

  | | Mejor | Segunda |
  |---|---|---|
  | Lunes | 18:00 | 21:00 |
  | Martes | 18:00 | 21:30 |
  | Miércoles | 17:30 | 21:00 |
  | Jueves | 18:00 | 21:30 |
  | Viernes | 16:00 | 19:30 |
  | Sábado | 17:00 | 11:30 |
  | Domingo | 18:30 | 12:00 |

---

## 9. Lo que queda

1. **26/11 por la mañana:** comprobar que el reloj de las 4:30 hizo y subió el vídeo
   (`logs/dia-2026-11-26-0430.txt` en el volumen) y que **esta vez sí apuntó la línea en el
   historial**.
2. Rubén: revisar o quitar en YouTube Studio el vídeo subido sin revisar, `k3g3Q1TutkY`.
3. Vigilar el gasto de Modal el primer mes (estimado ~22 $/mes de 30).
4. **Segundo canal** (vídeos largos de 10-15 min con imágenes fijas): todo en `NUEVO-CANAL.md`. Se
   hace en otra conversación y no toca nada de este canal.
